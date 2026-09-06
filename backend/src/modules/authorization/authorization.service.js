import mongoose from "mongoose";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import RolePermission from "../roles/role-permission.model.js";
import Permission from "../permissions/permission.model.js";
import AccessGrant from "../access/access-grant.model.js";

export async function getMembership(userId, teamId) {
  if (!userId || !teamId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return null;
  }
  return Membership.findOne({ userId, teamId, status: "ACTIVE" });
}

export async function getActiveRoleIds(membershipId) {
  if (!membershipId || !mongoose.Types.ObjectId.isValid(membershipId)) return [];
  const membership = await Membership.findById(membershipId).select("roleIds status");
  if (!membership || membership.status !== "ACTIVE") return [];

  let roleIds = Array.isArray(membership.roleIds) && membership.roleIds.length > 0 ? membership.roleIds : null;

  if (!roleIds || roleIds.length === 0) {
    const membershipRoles = await MembershipRole.find({
      membershipId: membership._id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("roleId");
    roleIds = membershipRoles.map((mr) => mr.roleId);
  }

  if (!roleIds || roleIds.length === 0) return [];

  const activeRoles = await Role.find({
    _id: { $in: roleIds },
    status: "ACTIVE",
  }).select("_id");

  return activeRoles.map((r) => r._id);
}

export async function resolveRolePermissions(userId, teamId) {
  if (!userId || !teamId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return new Set();
  }
  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" });
  if (!membership) return new Set();

  let roleIds = Array.isArray(membership.roleIds) && membership.roleIds.length > 0 ? membership.roleIds : null;

  if (!roleIds || roleIds.length === 0) {
    const membershipRoles = await MembershipRole.find({
      membershipId: membership._id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("roleId");
    roleIds = membershipRoles.map((mr) => mr.roleId);
  }

  if (!roleIds || roleIds.length === 0) return new Set();

  const roles = await Role.find({
    _id: { $in: roleIds },
    status: "ACTIVE",
  }).select("permissions");

  const permissionKeys = new Set();
  const rolesNeedingFallback = [];

  for (const role of roles) {
    if (Array.isArray(role.permissions) && role.permissions.length > 0) {
      for (const perm of role.permissions) {
        permissionKeys.add(perm);
      }
    } else {
      rolesNeedingFallback.push(role._id);
    }
  }

  if (rolesNeedingFallback.length > 0) {
    const rolePermissions = await RolePermission.find({
      roleId: { $in: rolesNeedingFallback },
    }).populate("permissionId", "key");

    for (const rp of rolePermissions) {
      if (rp.permissionId?.key) {
        permissionKeys.add(rp.permissionId.key);
      }
    }
  }

  return permissionKeys;
}

export async function hasValidDirectGrant({ userId, teamId, permissionKey, resource = null }) {
  if (!userId || !teamId || !permissionKey) return false;
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) return false;

  const normalizedKey = permissionKey.toLowerCase().trim();

  const query = {
    userId,
    teamId,
    status: "ACTIVE",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  if (resource) {
    const resStr = resource.toString();
    query.resource = {
      $in: [resStr, `task:${resStr}`, resStr.replace(/^task:/, ""), "*", null],
    };
  }

  const grantByKey = await AccessGrant.findOne({
    ...query,
    permissionKey: normalizedKey,
  }).select("_id");

  if (grantByKey) return true;

  const permission = await Permission.findOne({ key: normalizedKey }).select("_id");
  if (permission) {
    const grantById = await AccessGrant.findOne({
      ...query,
      permissionId: permission._id,
    }).select("_id");
    if (grantById) return true;
  }

  return false;
}

export async function resolvePermissions(userId, teamId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }

  if (await isSuperAdmin(userId)) {
    const allPerms = await Permission.find({}).select("key");
    const allKeys = new Set(allPerms.map((p) => p.key));
    allKeys.add("*");
    return Array.from(allKeys);
  }

  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
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
    }).populate("permissionId", "key").select("permissionKey permissionId");

    for (const grant of grants) {
      if (grant.permissionKey) {
        permissions.add(grant.permissionKey);
      } else if (grant.permissionId?.key) {
        permissions.add(grant.permissionId.key);
      }
    }
  }

  return Array.from(permissions);
}

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

  if (user.isSuperAdmin === true) {
    return true;
  }
  if (user.isSuperAdmin === false) {
    return false;
  }

  const superAdminRole = await Role.findOne({
    name: { $in: ["Super Admin", "Platform Super Admin"] },
    isSystemRole: true,
    status: "ACTIVE",
  }).select("_id");

  if (superAdminRole) {
    const memberships = await Membership.find({ userId: idStr, status: "ACTIVE" }).select("_id");
    if (memberships.length > 0) {
      const hasRole = await MembershipRole.exists({
        membershipId: { $in: memberships.map((m) => m._id) },
        roleId: superAdminRole._id,
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });
      if (hasRole) {
        await User.updateOne({ _id: idStr }, { $set: { isSuperAdmin: true } });
        return true;
      }
    }
  }

  return false;
}

export async function isTeamAdmin(userId, teamId) {
  if (!userId || !teamId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return false;
  }
  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" });
  if (!membership) return false;

  const adminRole = await Role.findOne({
    name: { $in: ["Team Admin", "Admin"] },
    status: "ACTIVE",
  }).select("_id");
  if (!adminRole) return false;

  if (Array.isArray(membership.roleIds) && membership.roleIds.some((r) => String(r) === String(adminRole._id))) {
    return true;
  }

  const hasAdminRole = await MembershipRole.exists({
    membershipId: membership._id,
    roleId: adminRole._id,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  return Boolean(hasAdminRole);
}

export async function getAllSuperAdminUserIds() {
  const superAdmins = await User.find({
    isSuperAdmin: true,
    accountStatus: "ACTIVE",
  }).select("_id");

  const userIds = new Set(superAdmins.map((u) => u._id.toString()));

  const superAdminRoles = await Role.find({
    name: { $in: ["Super Admin", "Platform Super Admin"] },
    isSystemRole: true,
    status: "ACTIVE",
  }).select("_id");

  if (superAdminRoles.length > 0) {
    const memberRoles = await MembershipRole.find({
      roleId: { $in: superAdminRoles.map((r) => r._id) },
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("membershipId");

    if (memberRoles.length > 0) {
      const memberships = await Membership.find({
        _id: { $in: memberRoles.map((mr) => mr.membershipId) },
        status: "ACTIVE",
      }).select("userId");
      for (const m of memberships) {
        if (m.userId) userIds.add(m.userId.toString());
      }
    }
  }

  return Array.from(userIds);
}

export async function getUserActiveRoleNames(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];
  const memberships = await Membership.find({ userId, status: "ACTIVE" });
  if (!memberships.length) return [];

  let roleIds = memberships.flatMap((m) => m.roleIds || []);
  if (!roleIds.length) {
    const mRoles = await MembershipRole.find({
      membershipId: { $in: memberships.map((m) => m._id) },
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("roleId");
    roleIds = mRoles.map((mr) => mr.roleId);
  }

  if (!roleIds.length) return [];

  const roles = await Role.find({
    _id: { $in: roleIds },
    status: "ACTIVE",
  }).select("name");

  return Array.from(new Set(roles.map((r) => r.name).filter(Boolean)));
}

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

  if (isSuperAdminFlag) {
    return true;
  }

  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) return false;

  const membership = await Membership.findOne({
    userId: actorId,
    teamId,
    status: "ACTIVE",
  }).select("roleIds");

  if (!membership) {
    return false;
  }

  const normalizedAction = action.toLowerCase().trim();

  const rolePermissions = await resolveRolePermissions(actorId, teamId);
  if (rolePermissions.has(normalizedAction) || rolePermissions.has("*")) {
    return true;
  }

  return hasValidDirectGrant({
    userId: actorId,
    teamId,
    permissionKey: normalizedAction,
    resource: resourceId,
  });
}

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
