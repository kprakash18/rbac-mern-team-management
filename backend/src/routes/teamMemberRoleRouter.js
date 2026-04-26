import express from "express";
import {
	addUserToTeam,
	getMappings,
	removeUserFromTeam,
	updateRoleAssignment
} from "../controllers/teamMemberRoleController.js";
import { authenticateJwt } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

router.get("/", authenticateJwt, requirePermission("viewRoleMapping"), getMappings);
router.post("/add", authenticateJwt, requirePermission("assignRole"), addUserToTeam);
router.put("/role", authenticateJwt, requirePermission("assignRole"), updateRoleAssignment);
router.delete("/remove", authenticateJwt, requirePermission("deleteRoleMapping"), removeUserFromTeam);

export default router;