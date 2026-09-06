import mongoose from "mongoose";
import Membership from "../memberships/membership.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import AccessGrant from "../access/access-grant.model.js";

/**
 * 1. Find active team membership for a user
 */
export async function getMembership(userId, teamId) {
  if (!userId || !teamId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return null;
  }
  return Membership.findOne({ userId, teamId, status: "ACTIVE" });
}

/**
 * 2. Get active role IDs for a membership
 */
export async function getActiveRoleIds(membershipId) {
  if (!membershipId || !mongoose.Types.ObjectId.isValid(membershipId)) return [];
  const membership = await Membership.findById(membershipId).select("roleIds status");
  if (!membership || membership.status !== "ACTIVE" || !membership.roleIds) return [];

  const activeRoles = await Role.find({
    _id: { $in: membership.roleIds },
    status: "ACTIVE",
  }).select("_id");

  return activeRoles.map((r) => r._id);
}

/**
 * 3. Resolve all permission keys granted through the user's active team roles (Document-Native)
 */
export async function resolveRolePermissions(userId, teamId) {
  if (!userId || !teamId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return new Set();
  }
  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" }).select("roleIds");
  if (!membership || !membership.roleIds || membership.roleIds.length === 0) return new Set();

  const roles = await Role.find({
    _id: { $in: membership.roleIds },
    status: "ACTIVE",
  }).select("permissions");

  const permissionKeys = new Set();
  for (const role of roles) {
    if (Array.isArray(role.permissions)) {
      for (const perm of role.permissions) {
        permissionKeys.add(perm);
      }
    }
  }

  return permissionKeys;
}

/**
 * 4. Check if a valid, unexpired direct access grant exists (Document-Native)
 */
export async function hasValidDirectGrant({ userId, teamId, permissionKey, resource = null }) {
  if (!userId || !teamId || !permissionKey) return false;
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) return false;

  const normalizedKey = permissionKey.toLowerCase().trim();

  const query = {
    userId,
    teamId,
    permissionKey: normalizedKey,
    status: "ACTIVE",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  if (resource) {
    const resStr = resource.toString();
    query.resource = {
      $in: [resStr, `task:${resStr}`, resStr.replace(/^task:/, ""), "*", null],
    };
  }

  const grant = await AccessGrant.findOne(query).select("_id");
  return Boolean(grant);
}

/**
 * 5. Effective permissions array (Roles + Direct Grants)
 */
export async function resolvePermissions(userId, teamId) {
  if (!userId || !teamId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return [];
  }
  const permissions = await resolveRolePermissions(userId, teamId);

  const membership = await getMembership(userId, teamId);
  if (membership) {
    const grants = await AccessGrant.find({
      userId,
      teamId,
      status: "ACTIVE",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("permissionKey");

    for (const grant of grants) {
      if (grant.permissionKey) {
        permissions.add(grant.permissionKey);
      }
    }
  }

  return Array.from(permissions);
}

/**
 * Helper: Check if a user holds an active Super Admin platform flag
 */
export async function isSuperAdmin(userId) {
  if (!userId) return false;
  const idStr =
    userId instanceof mongoose.Types.ObjectId
      ? userId.toString()
      : userId._id
      ? userId._id.toString()
      : typeof userId === "string"
      ? userId
      : String(userId);

  if (!mongoose.Types.ObjectId.isValid(idStr)) return false;

  const user = await User.findById(idStr).select("isSuperAdmin accountStatus");
  if (!user || user.accountStatus === "SUSPENDED" || user.accountStatus === "DISABLED") {
    return false;
  }

  return Boolean(user.isSuperAdmin);
}

/**
 * Helper: Check if a user is a Team Admin in a specific team
 */
export async function isTeamAdmin(userId, teamId) {
  if (!userId || !teamId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return false;
  }
  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" }).select("roleIds");
  if (!membership || !membership.roleIds || membership.roleIds.length === 0) return false;

  const adminRole = await Role.exists({
    _id: { $in: membership.roleIds },
    name: { $in: ["Team Admin", "Admin"] },
    status: "ACTIVE",
  });

  return Boolean(adminRole);
}

/**
 * Helper: Get all active Super Admin User IDs across the system
 */
export async function getAllSuperAdminUserIds() {
  const superAdmins = await User.find({
    isSuperAdmin: true,
    accountStatus: "ACTIVE",
  }).select("_id");

  return superAdmins.map((u) => u._id.toString());
}

/**
 * Helper: Get unique active role names for a user across all active memberships
 */
export async function getUserActiveRoleNames(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];
  const memberships = await Membership.find({ userId, status: "ACTIVE" }).select("roleIds");
  if (!memberships.length) return [];

  const roleIds = memberships.flatMap((m) => m.roleIds || []);
  if (!roleIds.length) return [];

  const roles = await Role.find({
    _id: { $in: roleIds },
    status: "ACTIVE",
  }).select("name");

  return Array.from(new Set(roles.map((r) => r.name).filter(Boolean)));
}

/**
 * 6. High-Performance Layered Authorization Engine: can()
 * 
 * Supports both structured signature can({ actor, teamId, action, resourceId, resourceType })
 * and positional backwards-compatible signature can(actorOrUserId, teamId, action, resourceId, resourceType)
 * 
 * Invariants:
 * - Layer 1: Super Admin bypasses RBAC checks (if account is active)
 * - Layer 2: Gated strictly on active Membership (JIT grants cannot bypass membership requirement)
 * - Layer 3: Document-Native Role permissions check
 * - Layer 4: JIT / Direct AccessGrant check
 */
export async function can(param1, param2, param3, param4 = null, param5 = null) {
  let actor;
  let teamId;
  let action;
  let resourceId = null;
  let resourceType = null;

  if (
    param1 &&
    typeof param1 === "object" &&
    !(param1 instanceof mongoose.Types.ObjectId) &&
    (param1.actor || param1.user || param1.userId || param1.action || param1.permissionKey)
  ) {
    actor = param1.actor || param1.user || param1.userId;
    teamId = param1.teamId;
    action = param1.action || param1.permission || param1.permissionKey;
    resourceId = param1.resourceId || param1.resource || null;
    resourceType = param1.resourceType || null;
  } else {
    actor = param1;
    teamId = param2;
    action = param3;
    resourceId = param4;
    resourceType = param5;
  }

  if (!actor || !action) return false;

  let actorId = null;
  let isSuperAdminFlag = false;

  if (actor instanceof mongoose.Types.ObjectId) {
    actorId = actor.toString();
  } else if (typeof actor === "object" && actor !== null) {
    if (actor._id) {
      actorId = actor._id.toString();
    } else if (actor.id && typeof actor.id === "string") {
      actorId = actor.id;
    } else if (typeof actor.toString === "function") {
      actorId = actor.toString();
    }

    if (actor.accountStatus === "SUSPENDED" || actor.accountStatus === "DISABLED") {
      return false;
    }
    if (typeof actor.isSuperAdmin === "boolean") {
      isSuperAdminFlag = actor.isSuperAdmin;
    }
  } else if (typeof actor === "string") {
    actorId = actor;
  }

  if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) return false;

  if (!isSuperAdminFlag) {
    isSuperAdminFlag = await isSuperAdmin(actorId);
  }

  // Layer 1: Super Admin Bypass
  if (isSuperAdminFlag) {
    return true;
  }

  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) return false;

  // Layer 2: Membership Gating (Dual-Gated Fail-Closed Invariant)
  const membership = await Membership.findOne({
    userId: actorId,
    teamId,
    status: "ACTIVE",
  }).select("roleIds");

  if (!membership) {
    return false;
  }

  const normalizedAction = action.toLowerCase().trim();

  // Layer 3: Document-Native Role Resolution
  if (Array.isArray(membership.roleIds) && membership.roleIds.length > 0) {
    const activeRoles = await Role.find({
      _id: { $in: membership.roleIds },
      status: "ACTIVE",
    }).select("permissions");

    for (const role of activeRoles) {
      if (Array.isArray(role.permissions)) {
        if (role.permissions.includes(normalizedAction) || role.permissions.includes("*")) {
          return true;
        }
      }
    }
  }

  // Layer 4: JIT / Direct AccessGrant Resolution
  return hasValidDirectGrant({
    userId: actorId,
    teamId,
    permissionKey: normalizedAction,
    resource: resourceId,
  });
}

// get all permissions for a user across all teams
export async function getAllUserPermissions(userId) {
  if (!userId) return [];
  const memberships = await Membership.find({
    userId,
    status: "ACTIVE",
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
