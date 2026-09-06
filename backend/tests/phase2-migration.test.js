import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/database/connection.js";
import { env } from "../src/config/env.js";
import User from "../src/modules/users/user.model.js";
import Team from "../src/modules/teams/team.model.js";
import Role from "../src/modules/roles/role.model.js";
import RolePermission from "../src/modules/roles/role-permission.model.js";
import Permission from "../src/modules/permissions/permission.model.js";
import Membership from "../src/modules/memberships/membership.model.js";
import MembershipRole from "../src/modules/member-roles/member-role.model.js";
import AccessGrant from "../src/modules/access/access-grant.model.js";
import { runMigrationV2 } from "../scripts/migrate-v2.js";
import { createRole, updateRole } from "../src/modules/roles/role.service.js";
import { assignRoleToMember, revokeRoleAssignment } from "../src/modules/member-roles/member-role.service.js";
import { hashPassword } from "../src/common/security/password.js";

test.before(async () => {
  await connectDatabase(env.mongoUri);
});

test.after(async () => {
  await User.deleteMany({ email: /@test-phase2\.local$/ });
  await Team.deleteMany({ name: /Test Phase2/ });
  await Role.deleteMany({ name: /Test Phase2/ });
  await Permission.deleteMany({ key: /test\.phase2\./ });
  await AccessGrant.deleteMany({ resource: /test-phase2-/ });
  await disconnectDatabase();
});

test.describe("Phase 2 — Schema Migration & Dual-Model Backfill Tests", () => {

  test("1. runMigrationV2 backfills Role.permissions, Membership.roleIds, and AccessGrant.permissionKey", async () => {
    // A. Setup permissions
    const perm1 = await Permission.create({
      key: `test.phase2.task_read_${Date.now()}`,
      resource: "task",
      action: "read",
      category: "TASK_MANAGEMENT",
      description: "Read phase2 task",
    });

    const perm2 = await Permission.create({
      key: `test.phase2.task_write_${Date.now()}`,
      resource: "task",
      action: "write",
      category: "TASK_MANAGEMENT",
      description: "Write phase2 task",
    });

    // B. Setup User & Team
    const testUser = await User.create({
      name: "Phase2 User",
      email: `user-${Date.now()}@test-phase2.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const testTeam = await Team.create({
      name: `Test Phase2 Team ${Date.now()}`,
      createdBy: testUser._id,
      status: "ACTIVE",
    });

    // C. Create legacy Role with NO permissions array, but with RolePermission junction records
    const legacyRole = await Role.create({
      name: `Test Phase2 Role ${Date.now()}`,
      description: "Legacy role before backfill",
      createdBy: testUser._id,
      status: "ACTIVE",
      permissions: [], // empty or missing
    });

    await RolePermission.create([
      { roleId: legacyRole._id, permissionId: perm1._id, assignedBy: testUser._id },
      { roleId: legacyRole._id, permissionId: perm2._id, assignedBy: testUser._id },
    ]);

    // D. Create legacy Membership with NO roleIds, but with MembershipRole junction records
    const legacyMembership = await Membership.create({
      userId: testUser._id,
      teamId: testTeam._id,
      status: "ACTIVE",
      roleIds: [],
    });

    await MembershipRole.create({
      membershipId: legacyMembership._id,
      roleId: legacyRole._id,
      assignedBy: testUser._id,
      assignedAt: new Date(),
    });

    // E. Create legacy AccessGrant with NO permissionKey
    const legacyGrant = await AccessGrant.create({
      userId: testUser._id,
      teamId: testTeam._id,
      permissionId: perm1._id,
      resource: `test-phase2-task-${Date.now()}`,
      grantedBy: testUser._id,
      status: "ACTIVE",
    });

    // F. Execute migration on test fixtures
    const stats1 = await runMigrationV2({
      verbose: false,
      roleFilter: { _id: legacyRole._id },
      membershipFilter: { _id: legacyMembership._id },
      grantFilter: { _id: legacyGrant._id },
    });
    assert.equal(stats1.rolesUpdated, 1, "Exactly 1 test role should be updated in migration");
    assert.equal(stats1.membershipsUpdated, 1, "Exactly 1 test membership should be updated in migration");
    assert.equal(stats1.grantsUpdated, 1, "Exactly 1 test access grant should be updated in migration");

    // G. Verify Role.permissions
    const refreshedRole = await Role.findById(legacyRole._id);
    assert.ok(refreshedRole.permissions.includes(perm1.key));
    assert.ok(refreshedRole.permissions.includes(perm2.key));
    assert.equal(refreshedRole.permissions.length, 2);

    // H. Verify Membership.roleIds
    const refreshedMembership = await Membership.findById(legacyMembership._id);
    assert.ok(refreshedMembership.roleIds.some((id) => id.toString() === legacyRole._id.toString()));

    // I. Verify AccessGrant.permissionKey
    const refreshedGrant = await AccessGrant.findById(legacyGrant._id);
    assert.equal(refreshedGrant.permissionKey, perm1.key);
  });

  test("2. runMigrationV2 is 100% idempotent and does not mutate already backfilled data", async () => {
    // Run second migration pass on test fixtures
    const legacyRole = await Role.findOne({ name: /^Test Phase2 Role/ });
    const legacyMembership = await Membership.findOne({ roleIds: legacyRole._id });
    const legacyGrant = await AccessGrant.findOne({ permissionId: { $exists: true } });

    const stats2 = await runMigrationV2({
      verbose: false,
      roleFilter: { _id: legacyRole._id },
      membershipFilter: { _id: legacyMembership._id },
      grantFilter: { _id: legacyGrant._id },
    });
    assert.equal(stats2.rolesUpdated, 0, "Second migration pass MUST update 0 roles");
    assert.equal(stats2.membershipsUpdated, 0, "Second migration pass MUST update 0 memberships");
    assert.equal(stats2.grantsUpdated, 0, "Second migration pass MUST update 0 access grants");
  });

  test("3. Dual-writes keep document arrays and junction collections in sync for roles & memberships", async () => {
    const admin = await User.create({
      name: "Phase2 Admin",
      email: `admin-${Date.now()}@test-phase2.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: true,
    });

    const perm = await Permission.create({
      key: `test.phase2.dualwrite_${Date.now()}`,
      resource: "task",
      action: "edit",
      category: "TASK_MANAGEMENT",
      description: "Dual write test permission",
    });

    // 1. Create Role via service
    const createdRole = await createRole({
      name: `Test Phase2 Dual Role ${Date.now()}`,
      description: "Dual write test",
      permissionIds: [perm._id],
      createdBy: admin._id,
    });

    const roleDoc = await Role.findById(createdRole._id);
    assert.ok(roleDoc.permissions.includes(perm.key), "Role.permissions must contain perm key on createRole");

    const junctionRP = await RolePermission.findOne({ roleId: createdRole._id, permissionId: perm._id });
    assert.ok(junctionRP, "RolePermission junction doc must be created on createRole");

    // 2. Assign Role to member via service
    const team = await Team.create({
      name: `Test Phase2 Dual Team ${Date.now()}`,
      createdBy: admin._id,
      status: "ACTIVE",
    });

    const targetUser = await User.create({
      name: "Phase2 Target Member",
      email: `target-${Date.now()}@test-phase2.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
    });

    const membership = await Membership.create({
      userId: targetUser._id,
      teamId: team._id,
      status: "ACTIVE",
      roleIds: [],
    });

    const assignment = await assignRoleToMember({
      teamId: team._id,
      userId: targetUser._id,
      roleId: createdRole._id,
      assignedBy: admin._id,
    });

    const memAfterAssign = await Membership.findById(membership._id);
    assert.ok(
      memAfterAssign.roleIds.some((r) => r.toString() === createdRole._id.toString()),
      "Membership.roleIds must include roleId after assignRoleToMember"
    );

    // 3. Revoke Role from member via service
    await revokeRoleAssignment({
      teamId: team._id,
      userId: targetUser._id,
      assignmentId: assignment._id,
      revokedBy: admin._id,
    });

    const memAfterRevoke = await Membership.findById(membership._id);
    assert.ok(
      !memAfterRevoke.roleIds.some((r) => r.toString() === createdRole._id.toString()),
      "Membership.roleIds must NOT include roleId after revokeRoleAssignment"
    );
  });
});
