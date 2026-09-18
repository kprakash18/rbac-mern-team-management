import { Router } from "express";
import { invitationController as c } from "./invitation.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import {
  createInvitationSchema,
  invitationTokenParamSchema,
  listInvitationsSchema,
  revokeInvitationSchema,
} from "./invitation.validation.js";

const teamInvitationRouter = Router({ mergeParams: true });
teamInvitationRouter.post("/", authenticate, validateRequest(createInvitationSchema), requirePermission("invitation.create"), c.createInvitation);
teamInvitationRouter.get("/", authenticate, validateRequest(listInvitationsSchema), requirePermission("invitation.read"), c.getTeamInvitations);
teamInvitationRouter.delete("/:invitationId", authenticate, validateRequest(revokeInvitationSchema), requirePermission("invitation.revoke"), c.revokeInvitation);

const publicInvitationRouter = Router();
publicInvitationRouter.get("/verify/:token", validateRequest(invitationTokenParamSchema), c.verifyInvitation);
publicInvitationRouter.get("/:token", validateRequest(invitationTokenParamSchema), c.verifyInvitation);
publicInvitationRouter.post("/accept", c.acceptInvitation);
publicInvitationRouter.post("/accept/:token", c.acceptInvitation);

export { teamInvitationRouter, publicInvitationRouter };
export default teamInvitationRouter;
