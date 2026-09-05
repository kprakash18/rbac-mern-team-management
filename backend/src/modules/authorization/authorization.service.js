import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import RolePermission from "../roles/role-permission.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import Permission from "../permissions/permission.model.js";
import AccessGrant from "../access/access-grant.model.js";

/**
 * 1. Find active team membership for a user
 */
export async function getMembership(userId, teamId) {
  if (!userId || !teamId) return null;
  return Membership.findOne({ userId, teamId, status: "ACTIVE" });
}

/**
 * 2. Get active role IDs for a membership (filters out expired / disabled roles)
 */
export async function getActiveRoleIds(membershipId) {
  if (!membershipId) return [];

  const membershipRoles = await MembershipRole.find({
    membershipId,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).select("roleId");

  const roleIds = membershipRoles.map((mr) => mr.roleId);
  if (roleIds.length === 0) return [];

  const activeRoles = await Role.find({
    _id: { $in: roleIds },
    status: "ACTIVE",
  }).select("_id");

  return activeRoles.map((r) => r._id);
}

/**
 * 3. Resolve all permission keys granted through the user's active team roles
 */
export async function resolveRolePermissions(userId, teamId) {
  const membership = await getMembership(userId, teamId);
  if (!membership) return new Set();

  const roleIds = await getActiveRoleIds(membership._id);
  if (roleIds.length === 0) return new Set();

  const rolePermissions = await RolePermission.find({
    roleId: { $in: roleIds },
  }).populate("permissionId", "key");

  return new Set(
    rolePermissions
      .filter((rp) => rp.permissionId?.key)
      .map((rp) => rp.permissionId.key)
  );
}

/**
 * 4. Check if a valid, unexpired direct access grant exists
 */
export async function hasValidDirectGrant({ userId, teamId, permissionKey, resource = null }) {
  if (!userId || !teamId || !permissionKey) return false;

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

/**
 * 5. Effective permissions array (Roles + Direct Grants)
 */
export async function resolvePermissions(userId, teamId) {
  const permissions = await resolveRolePermissions(userId, teamId);

  const membership = await getMembership(userId, teamId);
  if (membership) {
    const grants = await AccessGrant.find({
      userId,
      teamId,
      status: "ACTIVE",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).populate("permissionId", "key");

    for (const grant of grants) {
      if (grant.permissionId?.key) {
        permissions.add(grant.permissionId.key);
      }
    }
  }

  return Array.from(permissions);
}

/**
 * Helper: Check if a user holds an active Super Admin role dynamically in the database
 */
export async function isSuperAdmin(userId) {
  if (!userId) return false;

  const superAdminRoles = await Role.find({
    name: { $in: ["Super Admin", "Platform Super Admin"] },
    status: "ACTIVE",
  }).select("_id");

  if (!superAdminRoles || superAdminRoles.length === 0) return false;
  const superAdminRoleIds = superAdminRoles.map((r) => r._id);

  const memberships = await Membership.find({
    userId,
    status: "ACTIVE",
  }).select("_id");

  if (!memberships || memberships.length === 0) return false;
  const membershipIds = memberships.map((m) => m._id);

  const hasSuperAdminRole = await MembershipRole.exists({
    membershipId: { $in: membershipIds },
    roleId: { $in: superAdminRoleIds },
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  return Boolean(hasSuperAdminRole);
}

/**
 * Helper: Check if a user is a Team Admin in a specific team
 */
export async function isTeamAdmin(userId, teamId) {
  if (!userId || !teamId) return false;
  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" }).select("_id");
  if (!membership) return false;

  const adminRole = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" }).select("_id");
  if (!adminRole) return false;

  const hasAdminRole = await MembershipRole.exists({
    membershipId: membership._id,
    roleId: adminRole._id,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  return Boolean(hasAdminRole);
}

/**
 * Helper: Get all active Super Admin User IDs across the system
 */
export async function getAllSuperAdminUserIds() {
  const superAdminRoles = await Role.find({
    name: { $in: ["Super Admin", "Platform Super Admin"] },
    status: "ACTIVE",
  }).select("_id");

  if (!superAdminRoles || superAdminRoles.length === 0) return [];
  const superAdminRoleIds = superAdminRoles.map((r) => r._id);

  const memberRoles = await MembershipRole.find({
    roleId: { $in: superAdminRoleIds },
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).select("membershipId");

  if (!memberRoles || memberRoles.length === 0) return [];
  const membershipIds = memberRoles.map((mr) => mr.membershipId);

  const memberships = await Membership.find({
    _id: { $in: membershipIds },
    status: "ACTIVE",
  }).select("userId");

  const userIds = memberships.map((m) => m.userId.toString());
  return Array.from(new Set(userIds));
}

/**
 * Helper: Get unique active role names for a user across all active memberships
 */
export async function getUserActiveRoleNames(userId) {
  if (!userId) return [];
  const memberships = await Membership.find({ userId, status: "ACTIVE" }).select("_id");
  if (!memberships.length) return [];
  const membershipIds = memberships.map((m) => m._id);

  const mRoles = await MembershipRole.find({
    membershipId: { $in: membershipIds },
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).populate("roleId", "name status");

  const names = new Set();
  for (const mr of mRoles) {
    if (mr.roleId?.name && mr.roleId.status === "ACTIVE") {
      names.add(mr.roleId.name);
    }
  }
  return Array.from(names);
}

/**
 * 6. Main access check: Can user perform permission in team on resource?
 *    Super Admins (verified dynamically via DB roles) bypass all team-scoped checks.
 */
export async function can(userId, teamId, permissionKey, resource = null) {
  if (!userId || !permissionKey) return false;

  // Dynamic Super Admin check: Any user holding an active Super Admin role
  // in the database has unrestricted global access without hardcoded emails.
  const userIsSuperAdmin = await isSuperAdmin(userId);
  if (userIsSuperAdmin) {
    return true;
  }

  if (!teamId) return false;

  // Step 1: Check Role permissions in the given team
  const rolePermissions = await resolveRolePermissions(userId, teamId);
  if (rolePermissions.has(permissionKey) || rolePermissions.has("*")) {
    return true;
  }

  // Step 2: Check Direct Access Grants
  return hasValidDirectGrant({ userId, teamId, permissionKey, resource });
}

// get all permissions for a user across all teams
export async function getAllUserPermissions(userId){
  if(!userId) return [];
  const memberships = await Membership.find({
    userId,
    status : "ACTIVE",
  }).populate("teamId", "name description status");
  
  const results = [];
  for (const membership of memberships) {
    if (!membership.teamId || membership.teamId.status === "ARCHIVED") {
      continue;
    }
    const teamPermissions = await resolvePermissions(userId, membership.teamId._id);
    results.push({
      teamId: membership.teamId._id,
      teamName: membership.teamId.name,
      permissions: teamPermissions,
    });
  }
  return results;
}

export const authorizationService = {
  getMembership,
  getActiveRoleIds,
  resolveRolePermissions,
  hasValidDirectGrant,
  resolvePermissions,
  can,
  isSuperAdmin,
  isTeamAdmin,
  getAllSuperAdminUserIds,
  getUserActiveRoleNames,
  getAllUserPermissions,
};

export default authorizationService;
