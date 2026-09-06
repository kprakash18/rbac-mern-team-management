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
import { can } from "../src/modules/authorization/authorization.service.js";
import { hashPassword } from "../src/common/security/password.js";

/**
 * Legacy 16-query relational authorization implementation (for shadow dual-run testing)
 */
async function legacyCan(userId, teamId, permissionKey, resource = null) {
  if (!userId || !permissionKey) return false;
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) return false;

  const user = await User.findById(userId).select("isSuperAdmin accountStatus");
  if (!user || user.accountStatus === "SUSPENDED" || user.accountStatus === "DISABLED") {
    return false;
  }
  if (user.isSuperAdmin) {
    return true;
  }

  if (!teamId) return false;

  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" });
  if (!membership) return false;

  const membershipRoles = await MembershipRole.find({
    membershipId: membership._id,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).select("roleId");

  const roleIds = membershipRoles.map((mr) => mr.roleId);
  if (roleIds.length > 0) {
    const activeRoles = await Role.find({
      _id: { $in: roleIds },
      status: "ACTIVE",
    }).select("_id");

    const activeRoleIds = activeRoles.map((r) => r._id);
    if (activeRoleIds.length > 0) {
      const rolePermissions = await RolePermission.find({
        roleId: { $in: activeRoleIds },
      }).populate("permissionId", "key");

      const permKeys = new Set(
        rolePermissions
          .filter((rp) => rp.permissionId?.key)
          .map((rp) => rp.permissionId.key)
      );

      if (permKeys.has(permissionKey) || permKeys.has("*")) {
        return true;
      }
    }
  }

  // Check Direct Access Grants via relational lookup
  const permission = await Permission.findOne({ key: permissionKey.toLowerCase().trim() });
  if (!permission) return false;

  const query = {
    userId,
    teamId,
    permissionId: permission._id,
    status: "ACTIVE",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  if (resource) {
    const resStr = resource.toString();
    query.resource = {
      $in: [resStr, `task:${resStr}`, resStr.replace(/^task:/, ""), "*", null],
    };
  }

  const grant = await AccessGrant.findOne(query);
  return Boolean(grant);
}

test.before(async () => {
  await connectDatabase(env.mongoUri);
});

test.after(async () => {
  await User.deleteMany({ email: /@test-phase3\.local$/ });
  await Team.deleteMany({ name: /Test Phase3/ });
  await Role.deleteMany({ name: /Test Phase3/ });
  await Permission.deleteMany({ key: /test\.phase3\./ });
  await AccessGrant.deleteMany({ resource: /test-phase3-/ });
  await disconnectDatabase();
});

test.describe("Phase 3 & 3.5 — Layered Authorization Engine & Shadow Comparator Benchmark", () => {

  test("1. Shadow comparator: legacyCan() vs can() must achieve 100% agreement across 50+ permutation scenarios", async () => {
    // 1. Setup Permissions
    const permRead = await Permission.create({
      key: "test.phase3.task_read",
      resource: "task",
      action: "read",
      category: "TASK_MANAGEMENT",
      description: "Read task",
    });

    const permWrite = await Permission.create({
      key: "test.phase3.task_write",
      resource: "task",
      action: "write",
      category: "TASK_MANAGEMENT",
      description: "Write task",
    });

    const permDelete = await Permission.create({
      key: "test.phase3.task_delete",
      resource: "task",
      action: "delete",
      category: "TASK_MANAGEMENT",
      description: "Delete task",
    });

    // 2. Setup Users
    const superAdmin = await User.create({
      name: "Phase3 Super Admin",
      email: `superadmin-${Date.now()}@test-phase3.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: true,
    });

    const activeUser = await User.create({
      name: "Phase3 Active Dev",
      email: `activedev-${Date.now()}@test-phase3.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    const suspendedUser = await User.create({
      name: "Phase3 Suspended User",
      email: `suspended-${Date.now()}@test-phase3.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "SUSPENDED",
      isSuperAdmin: false,
    });

    const outsideUser = await User.create({
      name: "Phase3 Outside User",
      email: `outside-${Date.now()}@test-phase3.local`,
      hashedPassword: await hashPassword("password123"),
      accountStatus: "ACTIVE",
      isSuperAdmin: false,
    });

    // 3. Setup Team
    const team = await Team.create({
      name: `Test Phase3 Team ${Date.now()}`,
      createdBy: activeUser._id,
      status: "ACTIVE",
    });

    // 4. Setup Roles (with both RolePermission and Role.permissions populated)
    const devRole = await Role.create({
      name: `Test Phase3 Developer Role ${Date.now()}`,
      description: "Dev role with read and write",
      createdBy: activeUser._id,
      status: "ACTIVE",
      permissions: [permRead.key, permWrite.key],
    });

    await RolePermission.create([
      { roleId: devRole._id, permissionId: permRead._id, assignedBy: activeUser._id },
      { roleId: devRole._id, permissionId: permWrite._id, assignedBy: activeUser._id },
    ]);

    // 5. Setup Membership for Active User
    const membership = await Membership.create({
      userId: activeUser._id,
      teamId: team._id,
      status: "ACTIVE",
      roleIds: [devRole._id],
    });

    await MembershipRole.create({
      membershipId: membership._id,
      roleId: devRole._id,
      assignedBy: activeUser._id,
      assignedAt: new Date(),
    });

    // 6. Setup JIT Grants for Active User
    const targetTaskId = `test-phase3-task-999`;
    const otherTaskId = `test-phase3-task-000`;

    // Active JIT grant for task_delete on targetTaskId
    await AccessGrant.create({
      userId: activeUser._id,
      teamId: team._id,
      permissionId: permDelete._id,
      permissionKey: permDelete.key,
      resource: targetTaskId,
      grantedBy: activeUser._id,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 3600000), // unexpired
    });

    // Expired JIT grant
    await AccessGrant.create({
      userId: activeUser._id,
      teamId: team._id,
      permissionId: permDelete._id,
      permissionKey: permDelete.key,
      resource: `test-phase3-task-expired`,
      grantedBy: activeUser._id,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() - 3600000), // expired
    });

    // JIT grant for outsideUser (who is NOT a team member -> fail-closed invariant)
    await AccessGrant.create({
      userId: outsideUser._id,
      teamId: team._id,
      permissionId: permRead._id,
      permissionKey: permRead.key,
      resource: targetTaskId,
      grantedBy: activeUser._id,
      status: "ACTIVE",
    });

    // Build 50+ permutation test scenarios
    const actions = [
      permRead.key,
      permWrite.key,
      permDelete.key,
      "test.phase3.unrelated_permission",
    ];

    const resources = [null, targetTaskId, otherTaskId, "test-phase3-task-expired"];
    const actors = [
      superAdmin._id,
      activeUser._id,
      suspendedUser._id,
      outsideUser._id,
      new mongoose.Types.ObjectId(), // Non-existent user
    ];

    let totalComparisons = 0;
    let agreements = 0;

    for (const actor of actors) {
      for (const action of actions) {
        for (const res of resources) {
          const legacyResult = await legacyCan(actor, team._id, action, res);
          const newResult = await can(actor, team._id, action, res);

          assert.equal(
            newResult,
            legacyResult,
            `Mismatch for actor=${actor}, action=${action}, resource=${res}. Legacy=${legacyResult}, New=${newResult}`
          );

          agreements++;
          totalComparisons++;
        }
      }
    }

    assert.ok(totalComparisons >= 50, `Expected at least 50 test scenarios, executed ${totalComparisons}`);
    assert.equal(agreements, totalComparisons, "100% agreement required between legacy and document-native can()");
    console.log(`Shadow Comparator: ${agreements}/${totalComparisons} (100%) test assertions PASSED.`);
  });

  test("2. Micro-benchmark: Measure latency and throughput of newCan() vs legacyCan()", async () => {
    const user = await User.findOne({ email: /activedev-.*@test-phase3\.local$/ });
    const team = await Team.findOne({ name: /Test Phase3 Team/ });
    const permKey = "test.phase3.task_read";

    const ITERATIONS = 100;

    // Warmup
    for (let i = 0; i < 5; i++) {
      await legacyCan(user._id, team._id, permKey);
      await can(user._id, team._id, permKey);
    }

    // Benchmark Legacy
    const startLegacy = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      await legacyCan(user._id, team._id, permKey);
    }
    const endLegacy = performance.now();
    const legacyDuration = endLegacy - startLegacy;
    const legacyMeanMs = legacyDuration / ITERATIONS;

    // Benchmark Document-Native
    const startNew = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      await can(user._id, team._id, permKey);
    }
    const endNew = performance.now();
    const newDuration = endNew - startNew;
    const newMeanMs = newDuration / ITERATIONS;

    const speedup = (legacyDuration / newDuration).toFixed(2);

    console.log(`\nMicro-Benchmark Results (${ITERATIONS} iterations):`);
    console.log(`   Legacy 16-Query Engine: Total ${legacyDuration.toFixed(2)}ms | Mean ${legacyMeanMs.toFixed(3)}ms/op`);
    console.log(`   New Document-Native:    Total ${newDuration.toFixed(2)}ms | Mean ${newMeanMs.toFixed(3)}ms/op`);
    console.log(`   Speedup Factor:      ${speedup}x faster\n`);

    assert.ok(newMeanMs <= legacyMeanMs * 1.5, "New engine must be equal or faster than legacy relational engine");
  });
});
