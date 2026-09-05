import { Router } from "express";
import { invitationController } from "./invitation.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

// Team-scoped router (mounted at /api/teams/:teamId/invitations)
const teamInvitationRouter = Router({ mergeParams: true });

teamInvitationRouter.post("/", authenticate, requirePermission("invitation.create"), invitationController.createInvitation);

teamInvitationRouter.get("/", authenticate, requirePermission("invitation.read"), invitationController.getTeamInvitations);

teamInvitationRouter.delete("/:invitationId", authenticate, requirePermission("invitation.revoke"), invitationController.revokeInvitation);


// Public router (mounted at /api/invitations)
const publicInvitationRouter = Router();

publicInvitationRouter.get("/verify/:token", invitationController.verifyInvitation);
publicInvitationRouter.get("/:token", invitationController.verifyInvitation);
publicInvitationRouter.post("/accept", invitationController.acceptInvitation);
publicInvitationRouter.post("/accept/:token", invitationController.acceptInvitation);

export { teamInvitationRouter, publicInvitationRouter };
export default teamInvitationRouter;
