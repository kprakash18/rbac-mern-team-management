import { Router } from "express";
import { userController } from "./user.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const router = Router();

router.get("/search", authenticate, userController.searchUsers);
router.get("/", authenticate, userController.searchUsers);

export default router;
