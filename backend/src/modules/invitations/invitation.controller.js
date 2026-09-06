import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  createInvitation,
  verifyInvitation,
  acceptInvitation,
  getTeamInvitations,
  revokeInvitation,
} from "./invitation.service.js";

export const invitationController = {
  verifyInvitation: asyncHandler(async (req, res) => {
    const token = req.params.token || req.query.token;
    const data = await verifyInvitation(token);
    res.status(200).json({ success: true, data });
  }),

  createInvitation: asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { email, roleIds } = req.body;
    const invitedByUserId = req.user.id || req.user.sub;
    const data = await createInvitation({ teamId, email, roleIds, invitedByUserId });
    res.status(201).json({ success: true, message: "Invitation created successfully.", data });
  }),

  acceptInvitation: asyncHandler(async (req, res) => {
    const token = req.params.token || req.body.token || req.query.token;
    const { name, password } = req.body;
    const data = await acceptInvitation({ token, name, password });
    res.status(200).json({ success: true, message: "Invitation accepted successfully.", data });
  }),

  getTeamInvitations: asyncHandler(async (req, res) => {
    const data = await getTeamInvitations({ teamId: req.params.teamId, status: req.query.status });
    res.status(200).json({ success: true, data });
  }),

  revokeInvitation: asyncHandler(async (req, res) => {
    const { teamId, invitationId } = req.params;
    const revokedByUserId = req.user.id || req.user.sub;
    const result = await revokeInvitation({ teamId, invitationId, revokedByUserId });
    res.status(200).json({ success: true, message: result.message });
  }),
};

export default invitationController;
