import permissionService from "./permission.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

export const getPermissions = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const permissions = await permissionService.listPermissions({ category });
  res.status(200).json({
    success: true,
    data: permissions,
    count: permissions.length,
  });
});

export const getPermissionById = asyncHandler(async (req, res) => {
  const { permissionId } = req.params;
  const permission = await permissionService.getPermissionById(permissionId);
  res.status(200).json({
    success: true,
    data: permission,
  });
});

export const permissionController = {
  getPermissions,
  getPermissionById,
};

export default permissionController;