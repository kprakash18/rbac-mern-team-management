import express from "express";
import { assignRole, getMappings } from "../controllers/teamMemberRoleController.js";

const router = express.Router();

router.post("/assign-role", assignRole);
router.get("/", getMappings);

export default router;