import { Router } from "express";
import { userController as c } from "./user.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";

const router = Router();
router.get("/search", authenticate, c.searchUsers);
router.get("/", authenticate, c.searchUsers);
router.put("/:userId", authenticate, c.updateUser);
router.patch("/:userId", authenticate, c.updateUser);

export default router;
