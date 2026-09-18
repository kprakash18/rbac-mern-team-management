import { Router } from "express";
import { userController as c } from "./user.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireSelfOrSuperAdmin, requireSuperAdmin } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { searchUsersSchema, updateUserSchema } from "./user.validation.js";

const router = Router();
router.get("/stats", authenticate, requireSuperAdmin(), c.getUserStats);
router.get("/search", authenticate, validateRequest(searchUsersSchema), requireSuperAdmin(), c.searchUsers);
router.get("/", authenticate, validateRequest(searchUsersSchema), requireSuperAdmin(), c.searchUsers);
router.put("/:userId", authenticate, validateRequest(updateUserSchema), requireSelfOrSuperAdmin(), c.updateUser);
router.patch("/:userId", authenticate, validateRequest(updateUserSchema), requireSelfOrSuperAdmin(), c.updateUser);

export default router;
