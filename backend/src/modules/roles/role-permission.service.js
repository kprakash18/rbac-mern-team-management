import Role from "./role.model.js";
import RolePermission from "./role-permission.model.js";
import Permission from "../permissions/permission.model.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../common/errors/index.js";
import mongoose from "mongoose";

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
  }

  // 5. Return updated list of permissions
  return getPermissionsForRole(role._id);
}

export async function removePermissionFromRole(roleId, permissionId) {
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

  await RolePermission.deleteOne({ roleId: role._id, permissionId });
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
