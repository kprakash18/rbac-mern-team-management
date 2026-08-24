import { Router } from "express";
import { roleController } from "./role.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const router = Router();

// Role CRUD
router.post("/", authenticate, requirePermission("role.create"), roleController.createRole);
router.get("/", authenticate, requirePermission("role.read"), roleController.getRoles);
router.get("/:roleId", authenticate, requirePermission("role.read"), roleController.getRoleById);
router.patch("/:roleId", authenticate, requirePermission("role.update"), roleController.updateRole);
router.delete("/:roleId", authenticate, requirePermission("role.delete"), roleController.deleteRole);

// Role <-> Permission Mappings
router.post("/:roleId/permissions", authenticate, requirePermission("permission.assign"), roleController.addPermissionsToRole);
router.get("/:roleId/permissions", authenticate, requirePermission("role.read"), roleController.getRolePermissions);
router.delete("/:roleId/permissions/:permissionId", authenticate, requirePermission("permission.assign"), roleController.removePermissionFromRole);

export default router;
