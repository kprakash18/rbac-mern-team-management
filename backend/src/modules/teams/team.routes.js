import { Router } from "express";
import { teamController as c } from "./team.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { createTeamBroadcastController, getTeamBroadcastsController } from "../notifications/notification.controller.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { teamBroadcastSchema } from "../notifications/notification.validation.js";
import {
  createTeamSchema,
  listTeamsSchema,
  teamIdParamSchema,
  updateTeamSchema,
} from "./team.validation.js";

const router = Router();
router.post("/", authenticate, validateRequest(createTeamSchema), c.createTeam);
router.get("/my-teams", authenticate, c.getMyTeams);
router.get("/", authenticate, validateRequest(listTeamsSchema), c.getTeams);
router.get("/:teamId/bootstrap", authenticate, validateRequest(teamIdParamSchema), c.getWorkspaceBootstrap);
router.get("/:teamId", authenticate, validateRequest(teamIdParamSchema), requirePermission("team.read"), c.getTeamById);
router.patch("/:teamId", authenticate, validateRequest(updateTeamSchema), requirePermission("team.update"), c.updateTeam);
router.delete("/:teamId", authenticate, validateRequest(teamIdParamSchema), requirePermission("team.delete"), c.archiveTeam);
router.post("/:teamId/broadcasts", authenticate, validateRequest(teamBroadcastSchema), requirePermission(["notification.update", "team.update"]), createTeamBroadcastController);
router.get("/:teamId/broadcasts", authenticate, validateRequest(teamIdParamSchema), requirePermission("team.read"), getTeamBroadcastsController);

export default router;
