import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  createInvitation,
  verifyInvitation,
  acceptInvitation,
  getTeamInvitations,
  revokeInvitation,
} from "./invitation.service.js";
import { sendCreated, sendSuccess } from "../../common/http/response.js";

export const invitationController = {
  verifyInvitation: asyncHandler(async (req, res) => {
    const token = req.params.token || req.query.token;
    const data = await verifyInvitation(token);
    sendSuccess(res, { data });
  }),

  createInvitation: asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { email, name, fullName, roleIds } = req.body;
    const invitedByUserId = req.user.id || req.user.sub;
    const data = await createInvitation({ teamId, email, name: name || fullName, roleIds, invitedByUserId });
    sendCreated(res, { message: "Invitation created successfully.", data });
  }),

  acceptInvitation: asyncHandler(async (req, res) => {
    const token = req.params.token || req.body.token || req.query.token;
    const { name, password } = req.body;
    const data = await acceptInvitation({ token, name, password });
    sendSuccess(res, { message: "Invitation accepted successfully.", data });
  }),

  getTeamInvitations: asyncHandler(async (req, res) => {
    const data = await getTeamInvitations({ teamId: req.params.teamId, status: req.query.status });
    sendSuccess(res, { data });
  }),

  revokeInvitation: asyncHandler(async (req, res) => {
    const { teamId, invitationId } = req.params;
    const revokedByUserId = req.user.id || req.user.sub;
    const result = await revokeInvitation({ teamId, invitationId, revokedByUserId });
    sendSuccess(res, { message: result.message });
  }),
};

export default invitationController;
