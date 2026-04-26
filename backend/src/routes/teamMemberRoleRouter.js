import express from "express";
import { assignRole, getMappings } from "../controllers/teamMemberRoleController.js";
import { authenticateJwt } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

router.post("/assign-role", authenticateJwt, requirePermission("assignRole"), assignRole);
router.get("/", authenticateJwt, requirePermission("viewRoleMapping"), getMappings);

export default router;