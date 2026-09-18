import { Router } from "express";
import { roleController as c } from "./role.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import {
  assignRolePermissionsSchema,
  createRoleSchema,
  deleteRoleSchema,
  roleIdParamSchema,
  rolePermissionParamSchema,
  updateRoleSchema,
} from "./role.validation.js";

const router = Router();
router.post("/", authenticate, validateRequest(createRoleSchema), requirePermission("role.create"), c.createRole);
router.get("/", authenticate, requirePermission("role.read"), c.getRoles);
router.get("/:roleId", authenticate, validateRequest(roleIdParamSchema), requirePermission("role.read"), c.getRoleById);
router.patch("/:roleId", authenticate, validateRequest(updateRoleSchema), requirePermission("role.update"), c.updateRole);
router.delete("/:roleId", authenticate, validateRequest(deleteRoleSchema), requirePermission("role.delete"), c.deleteRole);

router.post("/:roleId/permissions", authenticate, validateRequest(assignRolePermissionsSchema), requirePermission("permission.assign"), c.addPermissionsToRole);
router.get("/:roleId/permissions", authenticate, validateRequest(roleIdParamSchema), requirePermission("role.read"), c.getRolePermissions);
router.delete("/:roleId/permissions/:permissionId", authenticate, validateRequest(rolePermissionParamSchema), requirePermission("permission.assign"), c.removePermissionFromRole);

export default router;
