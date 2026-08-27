import { Router } from "express";
import { invitationController } from "./invitation.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const router = Router({ mergeParams: true });

// POST /api/teams/:teamId/invitations
router.post(
  "/",
  authenticate,
  requirePermission("membership.create"),
  invitationController.createInvitation
);

export default router;
