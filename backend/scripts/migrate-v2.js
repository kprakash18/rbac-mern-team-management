import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/database/connection.js";
import { env } from "../src/config/env.js";
import Role from "../src/modules/roles/role.model.js";
import RolePermission from "../src/modules/roles/role-permission.model.js";
import Permission from "../src/modules/permissions/permission.model.js";
import Membership from "../src/modules/memberships/membership.model.js";
import MembershipRole from "../src/modules/member-roles/member-role.model.js";
import AccessGrant from "../src/modules/access/access-grant.model.js";

/**
 * Migration v2 — Document-Native Denormalization & Idempotent Backfill
 * 
 * Invariants:
 * 1. Backfills Role.permissions from RolePermission + Permission.key.
 * 2. Backfills Membership.roleIds from active MembershipRole records.
 * 3. Backfills AccessGrant.permissionKey from Permission.key.
 * 4. Ensures compound indexes on Role, Membership, AccessGrant.
 * 5. Idempotent: Can be executed N times without duplicate entries or data degradation.
 */
export async function runMigrationV2({
  verbose = true,
  roleFilter = {},
  membershipFilter = {},
  grantFilter = {},
} = {}) {
  const stats = {
    rolesExamined: 0,
    rolesUpdated: 0,
    membershipsExamined: 0,
    membershipsUpdated: 0,
    grantsExamined: 0,
    grantsUpdated: 0,
    indexesCreated: [],
  };

  const log = (...args) => {
    if (verbose) console.log(...args);
  };

  log("🚀 Starting Migration V2: Document-Native Schema Backfill...");

  // 1. Backfill Role.permissions
  const allRoles = await Role.find(roleFilter);
  stats.rolesExamined = allRoles.length;

  for (const role of allRoles) {
    const rolePermissions = await RolePermission.find({ roleId: role._id }).populate("permissionId");
    const permissionKeys = [
      ...new Set(
        rolePermissions
          .filter((rp) => rp.permissionId && rp.permissionId.key)
          .map((rp) => rp.permissionId.key.toLowerCase().trim())
      ),
    ];

    // Check if backfill is needed
    const currentKeys = Array.isArray(role.permissions) ? role.permissions : [];
    const keysMatch =
      currentKeys.length === permissionKeys.length &&
      permissionKeys.every((k) => currentKeys.includes(k));

    if (!keysMatch || !Array.isArray(role.permissions)) {
      await Role.updateOne(
        { _id: role._id },
        { $set: { permissions: permissionKeys } }
      );
      stats.rolesUpdated++;
    }
  }
  log(`✅ Roles: ${stats.rolesExamined} examined, ${stats.rolesUpdated} updated.`);

  // 2. Backfill Membership.roleIds
  const allMemberships = await Membership.find(membershipFilter);
  stats.membershipsExamined = allMemberships.length;

  for (const membership of allMemberships) {
    const activeMRoles = await MembershipRole.find({
      membershipId: membership._id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("roleId");

    const roleIds = [
      ...new Set(
        activeMRoles
          .filter((mr) => mr.roleId)
          .map((mr) => mr.roleId.toString())
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const currentRoleIds = Array.isArray(membership.roleIds)
      ? membership.roleIds.map((r) => r.toString())
      : [];
    const nextRoleIdsStrs = roleIds.map((r) => r.toString());

    const rolesMatch =
      currentRoleIds.length === nextRoleIdsStrs.length &&
      nextRoleIdsStrs.every((id) => currentRoleIds.includes(id));

    if (!rolesMatch || !Array.isArray(membership.roleIds)) {
      await Membership.updateOne(
        { _id: membership._id },
        { $set: { roleIds } }
      );
      stats.membershipsUpdated++;
    }
  }
  log(`Memberships: ${stats.membershipsExamined} examined, ${stats.membershipsUpdated} updated.`);

  // 3. Backfill AccessGrant.permissionKey
  const allGrants = await AccessGrant.find(grantFilter);
  stats.grantsExamined = allGrants.length;

  for (const grant of allGrants) {
    if (!grant.permissionKey && grant.permissionId) {
      const perm = await Permission.findById(grant.permissionId);
      if (perm && perm.key) {
        await AccessGrant.updateOne(
          { _id: grant._id },
          { $set: { permissionKey: perm.key.toLowerCase().trim() } }
        );
        stats.grantsUpdated++;
      }
    }
  }
  log(`AccessGrants: ${stats.grantsExamined} examined, ${stats.grantsUpdated} updated.`);

  // 4. Ensure Indexes
  await Role.syncIndexes();
  await Membership.syncIndexes();
  await AccessGrant.syncIndexes();
  stats.indexesCreated = ["Role(teamId, name)", "Membership(userId, teamId)", "AccessGrant(userId, teamId, status, permissionKey, resource, expiresAt)"];
  log("Indexes synchronized successfully.");

  log("🎉 Migration V2 Completed with Stats:", stats);
  return stats;
}

// Direct Execution Support (CLI)
if (process.argv[1] && process.argv[1].endsWith("migrate-v2.js")) {
  try {
    await connectDatabase(env.mongoUri);
    await runMigrationV2({ verbose: true });
    await disconnectDatabase();
    process.exit(0);
  } catch (err) {
    console.error("Migration V2 failed:", err);
    process.exit(1);
  }
}
