import express from "express";
import { createRole, getRoles } from "../controllers/roleController.js";
import { authenticateJwt } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

router.post("/", authenticateJwt, requirePermission("createRole"), createRole);
router.get("/", authenticateJwt, requirePermission("viewRole"), getRoles);

export default router;