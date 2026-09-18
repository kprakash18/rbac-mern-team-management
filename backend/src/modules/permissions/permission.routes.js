import { Router } from "express";
import permissionController from "./permission.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { listPermissionsSchema, permissionIdParamSchema } from "./permission.validation.js";

const router = Router();
router.get("/", authenticate, validateRequest(listPermissionsSchema), requirePermission("permission.read"), permissionController.getPermissions);
router.get("/:permissionId", authenticate, validateRequest(permissionIdParamSchema), requirePermission("permission.read"), permissionController.getPermissionById);

export default router;
