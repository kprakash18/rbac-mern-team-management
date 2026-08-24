import { Router } from "express";
import permissionController from "./permission.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import requirePermission from "../../common/middleware/authorize.js";

const router = Router() ;

router.get("/",authenticate,requirePermission("permission.read"), permissionController.getPermissions) ;
router.get("/:permissionId", authenticate, requirePermission("permission.read"), permissionController.getPermissionById) ;
export default router ;