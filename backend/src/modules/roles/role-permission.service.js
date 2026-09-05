import Role from "./role.model.js";
import RolePermission from "./role-permission.model.js";
import Permission from "../permissions/permission.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Membership from "../memberships/membership.model.js";
import { createBatchDomainNotifications } from "../notifications/notification.service.js";
import { emitToUser } from "../../realtime/event-emitter.js";
import {
  BadRequestError,
  NotFoundError,
} from "../../common/errors/index.js";
import mongoose from "mongoose";

async function notifyUsersWithRole(role, actorId, actionDescription) {
  try {
    const assignments = await MembershipRole.find({
      roleId: role._id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("membershipId");

    if (!assignments || assignments.length === 0) return;

    const membershipIds = assignments.map((a) => a.membershipId);
    const activeMembers = await Membership.find({
      _id: { $in: membershipIds },
      status: "ACTIVE",
    }).select("userId teamId");

    const notifications = activeMembers.map((m) => {
      emitToUser(m.userId, "access:changed", {
        teamId: m.teamId,
        reason: "PERMISSION_CHANGED",
        roleId: role._id,
      });

      return {
        recipientId: m.userId,
        actorId,
        type: "USER_ACCESS_CHANGED",
        teamId: m.teamId,
        resourceType: "ROLE",
        resourceId: role._id,
        metadata: {
          roleId: role._id,
          roleName: role.name,
          details: actionDescription,
        },
      };
    });

    await createBatchDomainNotifications(notifications);
  } catch (err) {
    console.error("Failed to notify users of role permission change:", err);
  }
}

export async function assignPermissionsToRole(roleId, permissionIds = [], assignedBy) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }

  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new BadRequestError("System roles cannot be modified or deleted.");
  }

  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    throw new BadRequestError("permissionIds must be a non-empty array.");
  }

  // 1. Validate all permission IDs exist
  const permissions = await Permission.find({ _id: { $in: permissionIds } });
  if (permissions.length !== permissionIds.length) {
    throw new BadRequestError("One or more permission IDs are invalid.");
  }

  // 2. Identify existing mappings to prevent duplicate errors
  const existingMappings = await RolePermission.find({
    roleId: role._id,
    permissionId: { $in: permissionIds },
  });
  const existingSet = new Set(
    existingMappings.map((m) => m.permissionId.toString())
  );

  // 3. Filter out any already-assigned permission IDs
  const newPermissionIds = permissionIds.filter(
    (pId) => !existingSet.has(pId.toString())
  );

  // 4. Insert only new junction documents
  if (newPermissionIds.length > 0) {
    const junctionDocs = newPermissionIds.map((pId) => ({
      roleId: role._id,
      permissionId: pId,
      assignedBy,
    }));
    await RolePermission.insertMany(junctionDocs);

    // Notify all active users with this role
    notifyUsersWithRole(
      role,
      assignedBy,
      `New permissions were added to role '${role.name}'.`
    );
  }

  // 5. Return updated list of permissions
  return getPermissionsForRole(role._id);
}

export async function removePermissionFromRole(roleId, permissionId, removedBy) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }

  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new BadRequestError("System roles cannot be modified or deleted.");
  }

  // Guardrail: Check if any active user holds this role
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
    notifyUsersWithRole(
      role,
      removedBy,
      `A permission was removed from role '${role.name}'.`
    );
  }

  return { success: true, message: "Permission removed from role successfully." };
}

export async function getPermissionsForRole(roleId) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }

  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }

  const rolePermissions = await RolePermission.find({ roleId: role._id }).populate(
    "permissionId"
  );

  return rolePermissions
    .filter((rp) => rp.permissionId)
    .map((rp) => rp.permissionId);
}

export const rolePermissionService = {
  assignPermissionsToRole,
  removePermissionFromRole,
  getPermissionsForRole,
};

export default rolePermissionService;
