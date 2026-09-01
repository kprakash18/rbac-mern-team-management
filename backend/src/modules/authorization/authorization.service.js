import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import RolePermission from "../roles/role-permission.model.js";

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
 * 6. Main access check: Can user perform permission in team on resource?
 */
export async function can(userId, teamId, permissionKey, resource = null) {
  if (!userId || !teamId || !permissionKey) return false;

  // Step 1: Check Role permissions
  const rolePermissions = await resolveRolePermissions(userId, teamId);
  if (rolePermissions.has(permissionKey)) {
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
  getAllUserPermissions,
};

export default authorizationService;
