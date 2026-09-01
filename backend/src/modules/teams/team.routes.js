import { Router } from "express";
import { teamController } from "./team.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const router = Router();

router.post("/", authenticate, teamController.createTeam);
router.get("/my-teams", authenticate, teamController.getMyTeams);
router.get("/", authenticate, teamController.getTeams);
router.get("/:teamId", authenticate, requirePermission("team.read"), teamController.getTeamById);
router.patch("/:teamId", authenticate, requirePermission("team.update"), teamController.updateTeam);
router.delete("/:teamId", authenticate, requirePermission("team.delete"), teamController.archiveTeam);


export default router;

