import permissionService from "./permission.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/http/response.js";

export const getPermissions = asyncHandler(async (req, res) => {
  const { category, scope } = req.query;
  const permissions = await permissionService.listPermissions({ category, scope });
  sendSuccess(res, { data: permissions, extra: { count: permissions.length } });
});

export const getPermissionById = asyncHandler(async (req, res) => {
  const { permissionId } = req.params;
  const permission = await permissionService.getPermissionById(permissionId);
  sendSuccess(res, { data: permission });
});

export const permissionController = {
  getPermissions,
  getPermissionById,
};

export default permissionController;
