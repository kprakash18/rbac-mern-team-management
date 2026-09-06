import { Router } from "express";
import { teamController as c } from "./team.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { createTeamBroadcastController, getTeamBroadcastsController } from "../notifications/notification.controller.js";

const router = Router();
router.post("/", authenticate, c.createTeam);
router.get("/my-teams", authenticate, c.getMyTeams);
router.get("/", authenticate, c.getTeams);
router.get("/:teamId/bootstrap", authenticate, c.getWorkspaceBootstrap);
router.get("/:teamId", authenticate, requirePermission("team.read"), c.getTeamById);
router.patch("/:teamId", authenticate, requirePermission("team.update"), c.updateTeam);
router.delete("/:teamId", authenticate, requirePermission("team.delete"), c.archiveTeam);
router.post("/:teamId/broadcasts", authenticate, createTeamBroadcastController);
router.get("/:teamId/broadcasts", authenticate, requirePermission("team.read"), getTeamBroadcastsController);

export default router;
