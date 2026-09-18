import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/http/response.js";
import roleService from "./role.service.js";
import rolePermissionService from "./role-permission.service.js";

export const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissionIds } = req.body;
  const role = await roleService.createRole({
    name,
    description,
    permissionIds,
    createdBy: req.user.id,
  });
  sendSuccess(res, { data: role });
});

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.listRoles({ status: req.query.status });
  sendSuccess(res, { data: roles, extra: { count: roles.length } });
});

export const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.roleId);
  sendSuccess(res, { data: role });
});

export const updateRole = asyncHandler(async (req, res) => {
  const { name, description, status, permissionIds } = req.body;
  const updatedRole = await roleService.updateRole(
    req.params.roleId,
    { name, description, status, permissionIds },
    req.user?.id
  );
  sendSuccess(res, { data: updatedRole });
});

export const deleteRole = asyncHandler(async (req, res) => {
  const reassignToRoleId = req.body?.reassignToRoleId || req.query?.reassignToRoleId;
  const result = await roleService.deleteRole(req.params.roleId, {
    reassignToRoleId,
    reassignedBy: req.user?.id,
  });
  sendSuccess(res, { message: result.message, data: result.data, extra: result });
});

export const addPermissionsToRole = asyncHandler(async (req, res) => {
  const updatedPermissions = await rolePermissionService.assignPermissionsToRole(
    req.params.roleId,
    req.body.permissionIds,
    req.user.id
  );
  sendSuccess(res, { data: updatedPermissions });
});

export const removePermissionFromRole = asyncHandler(async (req, res) => {
  const result = await rolePermissionService.removePermissionFromRole(
    req.params.roleId,
    req.params.permissionId
  );
  sendSuccess(res, { message: result.message, data: result.data, extra: result });
});

export const getRolePermissions = asyncHandler(async (req, res) => {
  const permissions = await rolePermissionService.getPermissionsForRole(req.params.roleId);
  sendSuccess(res, { data: permissions, extra: { count: permissions.length } });
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
