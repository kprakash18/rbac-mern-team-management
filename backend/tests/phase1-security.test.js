import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/database/connection.js";
import { env } from "../src/config/env.js";
import User from "../src/modules/users/user.model.js";
import Team from "../src/modules/teams/team.model.js";
import Role from "../src/modules/roles/role.model.js";
import Membership from "../src/modules/memberships/membership.model.js";
import MembershipRole from "../src/modules/member-roles/member-role.model.js";
import Invitation from "../src/modules/invitations/invitation.model.js";
import { isSuperAdmin, can } from "../src/modules/authorization/authorization.service.js";
import { updateUser } from "../src/modules/users/user.service.js";
import { createInvitation, acceptInvitation } from "../src/modules/invitations/invitation.service.js";
import { hashPassword, comparePassword } from "../src/common/security/password.js";

test.before(async () => {
  await connectDatabase(env.mongoUri);
});

test.after(async () => {
  // Cleanup test artifacts
  await User.deleteMany({ email: /@test-phase1\.local$/ });
  await Team.deleteMany({ name: /Test Phase1/ });
  await Role.deleteMany({ name: /Test Phase1/ });
  await Invitation.deleteMany({ email: /@test-phase1\.local$/ });
  await disconnectDatabase();
});

test.describe("Phase 1 — P0 Security & Identity Hardening Tests", () => {

  test("1. Regular user assigned role named 'Super Admin' MUST NOT become a platform Super Admin", async () => {
    // A. Create test user with isSuperAdmin: false
    const regularUser = await User.create({
      name: "Attacker User",
      email: "attacker@test-phase1.local",
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    // B. Create team A and team B
    const teamA = await Team.create({
      name: `Test Phase1 Team A ${Date.now()}`,
      createdBy: regularUser._id,
      status: "ACTIVE",
    });

    const teamB = await Team.create({
      name: `Test Phase1 Team B ${Date.now()}`,
      createdBy: regularUser._id,
      status: "ACTIVE",
    });

    // C. Create role named "Super Admin"
    const fakeSuperAdminRole = await Role.create({
      name: "Super Admin",
      description: "Fake custom role named Super Admin",
      createdBy: regularUser._id,
      status: "ACTIVE",
    });

    // D. Assign role to user in Team A
    const membershipA = await Membership.create({
      userId: regularUser._id,
      teamId: teamA._id,
      status: "ACTIVE",
    });

    await MembershipRole.create({
      membershipId: membershipA._id,
      roleId: fakeSuperAdminRole._id,
      assignedBy: regularUser._id,
    });

    // E. Verify isSuperAdmin returns FALSE
    const superAdminResult = await isSuperAdmin(regularUser._id);
    assert.equal(superAdminResult, false, "isSuperAdmin MUST be false even if user holds a role named 'Super Admin'");

    // F. Verify user cannot access Team B without membership
    const canAccessTeamB = await can(regularUser._id, teamB._id, "task.delete");
    assert.equal(canAccessTeamB, false, "Attacker cannot access foreign Team B despite holding role named 'Super Admin'");
  });

  test("2. Non-superadmin user cannot mass-assign isSuperAdmin to themselves via updateUser", async () => {
    const regularUser = await User.create({
      name: "Self Escalation Attacker",
      email: "self-escalate@test-phase1.local",
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    // Attempt self-update with isSuperAdmin: true
    await updateUser(regularUser._id, { isSuperAdmin: true, name: "Escalated Name" }, regularUser._id);

    const refreshedUser = await User.findById(regularUser._id);
    assert.equal(refreshedUser.isSuperAdmin, false, "isSuperAdmin field must remain false after self-update");
    assert.equal(refreshedUser.name, "Escalated Name", "Standard fields like name should update normally");
  });

  test("3. createInvitation response MUST NOT expose rawToken or inviteLink", async () => {
    const admin = await User.create({
      name: "Admin User",
      email: "admin-inviter@test-phase1.local",
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: true,
    });

    const team = await Team.create({
      name: `Test Phase1 Invite Team ${Date.now()}`,
      createdBy: admin._id,
      status: "ACTIVE",
    });

    const inviteResult = await createInvitation({
      teamId: team._id,
      email: "invited-target@test-phase1.local",
      invitedByUserId: admin._id,
    });

    assert.equal(inviteResult.token, undefined, "rawToken must not be present in createInvitation result");
    assert.equal(inviteResult.inviteLink, undefined, "inviteLink must not be present in createInvitation result");
    assert.ok(inviteResult.invitationId, "invitationId must be returned");
  });

  test("4. Existing user accepting invitation MUST NOT have their password overwritten", async () => {
    const originalPassword = "originalSecurePassword456!";
    const originalHash = await hashPassword(originalPassword);

    const existingUser = await User.create({
      name: "Existing Victim",
      email: "victim@test-phase1.local",
      hashedPassword: originalHash,
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    const inviter = await User.create({
      name: "Team Lead",
      email: "lead@test-phase1.local",
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const team = await Team.create({
      name: `Test Phase1 Team Victim ${Date.now()}`,
      createdBy: inviter._id,
      status: "ACTIVE",
    });

    // Create invitation directly in DB with mock token
    const rawToken = "test-raw-token-victim-12345678901234567890";
    const crypto = await import("node:crypto");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await Invitation.create({
      email: existingUser.email,
      teamId: team._id,
      invitedBy: inviter._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000),
      status: "PENDING",
    });

    // Accept invitation attempting to pass a new password
    await acceptInvitation({
      token: rawToken,
      name: "Modified Name",
      password: "hackedNewPassword789!",
    });

    // Verify existing user password is UNCHANGED
    const reloadedUser = await User.findById(existingUser._id).select("+hashedPassword");
    const isOriginalValid = await comparePassword(originalPassword, reloadedUser.hashedPassword);
    const isHackedValid = await comparePassword("hackedNewPassword789!", reloadedUser.hashedPassword);

    assert.equal(isOriginalValid, true, "Original password must remain valid after invite acceptance");
    assert.equal(isHackedValid, false, "Attacker-supplied new password must not overwrite existing password");
  });

  test("5. Invitation accepted twice concurrently or sequentially MUST fail with ConflictError on second attempt", async () => {
    const inviter = await User.create({
      name: "Inviter 2",
      email: "inviter2@test-phase1.local",
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const team = await Team.create({
      name: `Test Phase1 Double ${Date.now()}`,
      createdBy: inviter._id,
      status: "ACTIVE",
    });

    const rawToken = "double-accept-token-12345678901234567890";
    const crypto = await import("node:crypto");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await Invitation.create({
      email: "double-accept@test-phase1.local",
      teamId: team._id,
      invitedBy: inviter._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000),
      status: "PENDING",
    });

    // First acceptance -> SUCCESS
    const firstResult = await acceptInvitation({
      token: rawToken,
      name: "Double User",
      password: "password12345",
    });
    assert.ok(firstResult.token, "First accept must issue a valid token");

    // Second acceptance -> MUST THROW ConflictError
    await assert.rejects(
      async () => {
        await acceptInvitation({
          token: rawToken,
          name: "Double User Again",
          password: "password12345",
        });
      },
      {
        name: "ConflictError",
      },
      "Second acceptance attempt must throw ConflictError"
    );
  });
});
