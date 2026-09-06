import mongoose from "mongoose";
import Role from "./role.model.js";
import RolePermission from "./role-permission.model.js";
import Permission from "../permissions/permission.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Membership from "../memberships/membership.model.js";
import { createBatchDomainNotifications } from "../notifications/notification.service.js";
import { emitToUser } from "../../realtime/event-emitter.js";
import { BadRequestError, NotFoundError } from "../../common/errors/index.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

async function notifyUsersWithRole(role, actorId, actionDescription) {
  try {
    const assignments = await MembershipRole.find({
      roleId: role._id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("membershipId");

    if (!assignments?.length) return;

    const activeMembers = await Membership.find({
      _id: { $in: assignments.map((a) => a.membershipId) },
      status: "ACTIVE",
    }).select("userId teamId");

    const notifications = activeMembers.map((m) => {
      emitToUser(m.userId, "access:changed", { teamId: m.teamId, reason: "PERMISSION_CHANGED", roleId: role._id });
      return {
        recipientId: m.userId,
        actorId,
        type: "USER_ACCESS_CHANGED",
        teamId: m.teamId,
        resourceType: "ROLE",
        resourceId: role._id,
        metadata: { roleId: role._id, roleName: role.name, details: actionDescription },
      };
    });

    await createBatchDomainNotifications(notifications);
  } catch (err) {
    console.error("Failed to notify users of role permission change:", err);
  }
}

export async function assignPermissionsToRole(roleId, permissionIds = [], assignedBy) {
  if (!isValidId(roleId)) throw new NotFoundError("Role not found.");
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") throw new NotFoundError("Role not found.");
  if (role.isSystemRole) throw new BadRequestError("System roles cannot be modified or deleted.");
  if (!Array.isArray(permissionIds) || permissionIds.length === 0) throw new BadRequestError("permissionIds must be a non-empty array.");

  const permissions = await Permission.find({ _id: { $in: permissionIds } });
  if (permissions.length !== permissionIds.length) throw new BadRequestError("One or more permission IDs are invalid.");

  const existingMappings = await RolePermission.find({ roleId: role._id, permissionId: { $in: permissionIds } });
  const existingSet = new Set(existingMappings.map((m) => String(m.permissionId)));
  const newPermissionIds = permissionIds.filter((pId) => !existingSet.has(String(pId)));

  if (newPermissionIds.length > 0) {
    await RolePermission.insertMany(newPermissionIds.map((pId) => ({ roleId: role._id, permissionId: pId, assignedBy })));
    notifyUsersWithRole(role, assignedBy, `New permissions were added to role '${role.name}'.`);
  }

  return getPermissionsForRole(role._id);
}

export async function removePermissionFromRole(roleId, permissionId, removedBy) {
  if (!isValidId(roleId)) throw new NotFoundError("Role not found.");
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") throw new NotFoundError("Role not found.");
  if (role.isSystemRole) throw new BadRequestError("System roles cannot be modified or deleted.");

  const activeAssignments = await MembershipRole.find({
    roleId: role._id,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  if (activeAssignments.length > 0) {
    throw new BadRequestError(
      `Cannot remove permission from role "${role.name}" because it is currently assigned to ${activeAssignments.length} active user(s). Please reassign or unassign active members before removing permissions.`,
      "ROLE_HAS_ACTIVE_USERS"
    );
  }

  const result = await RolePermission.deleteOne({ roleId: role._id, permissionId });
  if (result.deletedCount > 0) {
    notifyUsersWithRole(role, removedBy, `A permission was removed from role '${role.name}'.`);
  }

  return { success: true, message: "Permission removed from role successfully." };
}

export async function getPermissionsForRole(roleId) {
  if (!isValidId(roleId)) throw new NotFoundError("Role not found.");
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") throw new NotFoundError("Role not found.");

  const rolePermissions = await RolePermission.find({ roleId: role._id }).populate("permissionId");
  return rolePermissions.filter((rp) => rp.permissionId).map((rp) => rp.permissionId);
}

export const rolePermissionService = {
  assignPermissionsToRole,
  removePermissionFromRole,
  getPermissionsForRole,
};

export default rolePermissionService;
