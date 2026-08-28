import { Router } from "express";
import { invitationController } from "./invitation.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

// Team-scoped router (mounted at /api/teams/:teamId/invitations)
const teamInvitationRouter = Router({ mergeParams: true });

teamInvitationRouter.post(
  "/",
  authenticate,
  requirePermission("membership.create"),
  invitationController.createInvitation
);

teamInvitationRouter.get(
  "/",
  authenticate,
  requirePermission("membership.read"),
  invitationController.getTeamInvitations
);

teamInvitationRouter.delete(
  "/:invitationId",
  authenticate,
  requirePermission("membership.delete"),
  invitationController.revokeInvitation
);

// Public router (mounted at /api/invitations)
const publicInvitationRouter = Router();

publicInvitationRouter.post("/accept", invitationController.acceptInvitation);

export { teamInvitationRouter, publicInvitationRouter };
export default teamInvitationRouter;
