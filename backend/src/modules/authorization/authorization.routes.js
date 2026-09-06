import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePasswordChangeCompleted } from "../../common/middleware/require-password-change.js";
import { getMyPermissionsController, checkPermissionController } from "./authorization.controller.js";

const router = Router();
router.use(authenticate, requirePasswordChangeCompleted);
router.get("/permissions", getMyPermissionsController);
router.post("/check", checkPermissionController);

export default router;
