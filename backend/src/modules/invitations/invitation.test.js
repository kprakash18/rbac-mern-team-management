import mongoose from "mongoose";
import { env } from "../../config/env.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Role from "../roles/role.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../memberships/membership-role.model.js";
import Invitation from "./invitation.model.js";
import {
  createInvitation,
  acceptInvitation,
  getTeamInvitations,
  revokeInvitation,
} from "./invitation.service.js";

async function runInvitationTests() {
  console.log("==================================================");
  console.log("🚀 Running Phase 7 Workspace Invitations Test Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  let createdUser = null;
  let createdMembership = null;

  try {
    await mongoose.connect(env.mongoUri);
    console.log(" Connected to database for Invitation verification.\n");

    // 1. Fixtures
    const adminUser = await User.findOne({ email: "admin@system.local" });
    const engTeam = await Team.findOne({ name: "Engineering Core" });
    const devRole = await Role.findOne({ name: "Developer", isSystemRole: true });

    // Clean up test invitation artifacts from previous runs if any
    await Invitation.deleteMany({
      email: { $in: ["newhire@example.com", "existingdev@example.com", "expired@example.com"] },
    });
    const priorTestUser = await User.findOne({ email: "newhire@example.com" });
    if (priorTestUser) {
      await MembershipRole.deleteMany({ assignedBy: adminUser._id, roleId: devRole._id });
      await Membership.deleteMany({ userId: priorTestUser._id });
      await User.deleteOne({ _id: priorTestUser._id });
    }

    // --- 1. Create Invitation with 1-Hour TTL ---
    console.log("--- 1. Cryptographic Token & 1-Hour TTL Creation ---");
    const inviteResult = await createInvitation({
      teamId: engTeam._id,
      email: "newhire@example.com",
      roleIds: [devRole._id],
      invitedByUserId: adminUser._id,
    });

    assert(inviteResult && inviteResult.token, "Plaintext token generated and returned");
    assert(inviteResult.status === "PENDING", "Invitation status initialized to PENDING");

    const ttlMs = new Date(inviteResult.expiresAt).getTime() - Date.now();
    const isApproxOneHour = ttlMs > 55 * 60 * 1000 && ttlMs <= 60 * 60 * 1000;
    assert(isApproxOneHour, "Invitation expiresAt set to approximately 1 hour");

    const savedDoc = await Invitation.findById(inviteResult.invitationId);
    assert(
      savedDoc && savedDoc.tokenHash && savedDoc.tokenHash !== inviteResult.token,
      "Database stores only SHA-256 tokenHash, never raw token"
    );

    // --- 2. Duplicate Pending Invitation Collision ---
    console.log("\n--- 2. Duplicate Pending Invitation Prevention ---");
    let duplicateInviteBlocked = false;
    try {
      await createInvitation({
        teamId: engTeam._id,
        email: "newhire@example.com",
        roleIds: [devRole._id],
        invitedByUserId: adminUser._id,
      });
    } catch (err) {
      duplicateInviteBlocked = err.statusCode === 409;
    }
    assert(duplicateInviteBlocked, "Duplicate pending invitation rejected with 409 Conflict");

    // --- 3. Accept Invitation (New User Provisioning & Immediate JWT) ---
    console.log("\n--- 3. Accept Invitation: New User Onboarding & Immediate JWT ---");
    const acceptResult = await acceptInvitation({
      token: inviteResult.token,
      name: "New Hire",
      password: "Password123!",
    });

    assert(acceptResult && acceptResult.token, "JWT token returned on acceptance");
    assert(
      acceptResult.user && acceptResult.user.email === "newhire@example.com",
      "New user provisioned with active status"
    );

    createdUser = await User.findOne({ email: "newhire@example.com" });
    assert(createdUser && createdUser.accountStatus === "ACTIVE", "User document created in DB with status ACTIVE");

    createdMembership = await Membership.findOne({
      userId: createdUser._id,
      teamId: engTeam._id,
    });
    assert(createdMembership && createdMembership.status === "ACTIVE", "Active Membership created for new user in team");

    const assignedRoles = await MembershipRole.find({
      membershipId: createdMembership._id,
      roleId: devRole._id,
    });
    assert(assignedRoles.length === 1, "Developer role assigned to member via MembershipRole");

    const acceptedInviteDoc = await Invitation.findById(inviteResult.invitationId);
    assert(
      acceptedInviteDoc.status === "ACCEPTED" && acceptedInviteDoc.acceptedAt !== null,
      "Invitation transitioned to ACCEPTED with acceptedAt timestamp"
    );

    // --- 4. Replay Protection (Single-Use Token) ---
    console.log("\n--- 4. Replay Attack & Token Single-Use Protection ---");
    let replayBlocked = false;
    try {
      await acceptInvitation({
        token: inviteResult.token,
        name: "New Hire",
        password: "Password123!",
      });
    } catch (err) {
      replayBlocked = err.statusCode === 409;
    }
    assert(replayBlocked, "Re-accepting already used token rejected with 409 Conflict");

    // --- 5. Revocation & Rejection of Revoked Invites ---
    console.log("\n--- 5. Invitation Revocation Lifecycle ---");
    await Invitation.deleteMany({ email: "existingdev@example.com" });
    const revokeInvite = await createInvitation({
      teamId: engTeam._id,
      email: "existingdev@example.com",
      roleIds: [devRole._id],
      invitedByUserId: adminUser._id,
    });

    const revokeResult = await revokeInvitation({
      teamId: engTeam._id,
      invitationId: revokeInvite.invitationId,
      revokedByUserId: adminUser._id,
    });
    assert(revokeResult && revokeResult.message.includes("revoked"), "Revocation acknowledged");

    let acceptRevokedBlocked = false;
    try {
      await acceptInvitation({
        token: revokeInvite.token,
        name: "Dev User",
        password: "Password123!",
      });
    } catch (err) {
      acceptRevokedBlocked = err.statusCode === 409;
    }
    assert(acceptRevokedBlocked, "Accepting revoked invitation rejected with 409 Conflict");

    // --- 6. Token Expiration Enforcement ---
    console.log("\n--- 6. Token Expiration Enforcement ---");
    await Invitation.deleteMany({ email: "expired@example.com" });
    const expiredInvite = await createInvitation({
      teamId: engTeam._id,
      email: "expired@example.com",
      roleIds: [devRole._id],
      invitedByUserId: adminUser._id,
    });

    // Manually backdate expiration in DB
    await Invitation.findByIdAndUpdate(expiredInvite.invitationId, {
      expiresAt: new Date(Date.now() - 5000),
    });

    let expiredBlocked = false;
    try {
      await acceptInvitation({
        token: expiredInvite.token,
        name: "Expired User",
        password: "Password123!",
      });
    } catch (err) {
      expiredBlocked = err.statusCode === 400;
    }
    assert(expiredBlocked, "Accepting expired token rejected with 400 Bad Request");

    // --- 7. List Team Invitations ---
    console.log("\n--- 7. List Team Invitations Auditing ---");
    const teamInvites = await getTeamInvitations({ teamId: engTeam._id });
    assert(
      Array.isArray(teamInvites) && teamInvites.length > 0,
      "Team invitations listed successfully with populated metadata"
    );

    // Cleanup test artifacts
    await Invitation.deleteMany({
      email: { $in: ["newhire@example.com", "existingdev@example.com", "expired@example.com"] },
    });
    if (createdUser && createdMembership) {
      await MembershipRole.deleteMany({ membershipId: createdMembership._id });
      await Membership.deleteOne({ _id: createdMembership._id });
      await User.deleteOne({ _id: createdUser._id });
    }

    console.log("\n==================================================");
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================\n");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("❌ Test suite encountered an unexpected error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runInvitationTests();
