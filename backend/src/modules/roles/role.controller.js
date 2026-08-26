import roleService from "./role.service.js";
import rolePermissionService from "./role-permission.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

export const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissionIds } = req.body;
  const role = await roleService.createRole({
    name,
    description,
    permissionIds,
    createdBy: req.user.id,
  });
  res.status(200).json({ success: true, data: role });
});

export const getRoles = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const roles = await roleService.listRoles({ status });
  res.status(200).json({ success: true, data: roles, count: roles.length });
});

export const getRoleById = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const role = await roleService.getRoleById(roleId);
  res.status(200).json({ success: true, data: role });
});

export const updateRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { name, description, status } = req.body;
  const updatedRole = await roleService.updateRole(roleId, { name, description, status });
  res.status(200).json({ success: true, data: updatedRole });
});

export const deleteRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const result = await roleService.deleteRole(roleId);
  res.status(200).json({ success: true, ...result });
});

export const addPermissionsToRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { permissionIds } = req.body;
  const updatedPermissions = await rolePermissionService.assignPermissionsToRole(
    roleId,
    permissionIds,
    req.user.id
  );
  res.status(200).json({ success: true, data: updatedPermissions });
});

export const removePermissionFromRole = asyncHandler(async (req, res) => {
  const { roleId, permissionId } = req.params;
  const result = await rolePermissionService.removePermissionFromRole(roleId, permissionId);
  res.status(200).json(result);
});

export const getRolePermissions = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const permissions = await rolePermissionService.getPermissionsForRole(roleId);
  res.status(200).json({ success: true, data: permissions, count: permissions.length });
});

export const roleController = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  addPermissionsToRole,
  removePermissionFromRole,
  getRolePermissions,
};

export default roleController;