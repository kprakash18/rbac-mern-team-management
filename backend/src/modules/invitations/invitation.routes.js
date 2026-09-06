import { Router } from "express";
import { invitationController as c } from "./invitation.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const teamInvitationRouter = Router({ mergeParams: true });
teamInvitationRouter.post("/", authenticate, requirePermission("invitation.create"), c.createInvitation);
teamInvitationRouter.get("/", authenticate, requirePermission("invitation.read"), c.getTeamInvitations);
teamInvitationRouter.delete("/:invitationId", authenticate, requirePermission("invitation.revoke"), c.revokeInvitation);

const publicInvitationRouter = Router();
publicInvitationRouter.get("/verify/:token", c.verifyInvitation);
publicInvitationRouter.get("/:token", c.verifyInvitation);
publicInvitationRouter.post("/accept", c.acceptInvitation);
publicInvitationRouter.post("/accept/:token", c.acceptInvitation);

export { teamInvitationRouter, publicInvitationRouter };
export default teamInvitationRouter;
