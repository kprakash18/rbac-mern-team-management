import { Router } from "express";
import { roleController as c } from "./role.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const router = Router();
router.post("/", authenticate, requirePermission("role.create"), c.createRole);
router.get("/", authenticate, requirePermission("role.read"), c.getRoles);
router.get("/:roleId", authenticate, requirePermission("role.read"), c.getRoleById);
router.patch("/:roleId", authenticate, requirePermission("role.update"), c.updateRole);
router.delete("/:roleId", authenticate, requirePermission("role.delete"), c.deleteRole);

router.post("/:roleId/permissions", authenticate, requirePermission("permission.assign"), c.addPermissionsToRole);
router.get("/:roleId/permissions", authenticate, requirePermission("role.read"), c.getRolePermissions);
router.delete("/:roleId/permissions/:permissionId", authenticate, requirePermission("permission.assign"), c.removePermissionFromRole);

export default router;
