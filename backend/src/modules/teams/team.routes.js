import { Router } from "express";
import { teamController } from "./team.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import {
  createTeamBroadcastController,
  getTeamBroadcastsController,
} from "../notifications/notification.controller.js";

const router = Router();

router.post("/", authenticate, teamController.createTeam);
router.get("/my-teams", authenticate, teamController.getMyTeams);
router.get("/", authenticate, teamController.getTeams);
router.get("/:teamId", authenticate, requirePermission("team.read"), teamController.getTeamById);
router.patch("/:teamId", authenticate, requirePermission("team.update"), teamController.updateTeam);
router.delete("/:teamId", authenticate, requirePermission("team.delete"), teamController.archiveTeam);

// Team Broadcasts
router.post("/:teamId/broadcasts", authenticate, createTeamBroadcastController);
router.get("/:teamId/broadcasts", authenticate, requirePermission("team.read"), getTeamBroadcastsController);

export default router;

