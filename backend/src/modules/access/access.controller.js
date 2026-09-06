import { asyncHandler } from "../../common/utils/async-handler.js";
import * as accessService from "./access.service.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";

export const createAccessRequestController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const requesterId = req.user.id;
  const { targetUserId, permissionKey, permissionId, resource, reason, durationHours, durationMinutes } = req.body ?? {};

  const accessRequest = await accessService.createAccessRequest({
    requesterId,
    targetUserId,
    teamId,
    permissionKey,
    permissionId,
    resource,
    reason,
    durationHours,
    durationMinutes,
  });

  res.status(201).json({ success: true, data: accessRequest });
});

export const getAllAccessRequestsController = asyncHandler(async (req, res) => {
  const result = await accessService.getAllAccessRequests({
    query: req.query,
    viewerId: req.user.id,
  });

  res.status(200).json({
    success: true,
    data: result.requests,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getAccessRequestsByTeamController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const viewerId = req.user.id;

  let viewerIsAdmin = Boolean(req.user.isSuperAdmin);
  if (!viewerIsAdmin) {
    const membership = await Membership.findOne({ userId: viewerId, teamId, status: "ACTIVE" });
    if (membership) {
      const adminRole = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" }).select("_id");
      if (adminRole) {
        viewerIsAdmin = Boolean(
          await MembershipRole.exists({
            membershipId: membership._id,
            roleId: adminRole._id,
            revokedAt: null,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          })
        );
      }
    }
  }

  const result = await accessService.getAccessRequestsByTeam({
    teamId,
    query: req.query,
    viewerId,
    viewerIsAdmin,
  });

  res.status(200).json({
    success: true,
    data: result.requests,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getAccessRequestByIdController = asyncHandler(async (req, res) => {
  const request = await accessService.getAccessRequestById({
    teamId: req.params.teamId,
    requestId: req.params.requestId,
  });
  res.status(200).json({ success: true, data: request });
});

export const updateAccessRequestController = asyncHandler(async (req, res) => {
  const request = await accessService.updateAccessRequest({
    teamId: req.params.teamId,
    requestId: req.params.requestId,
    requesterId: req.user.id,
    updates: req.body,
  });
  res.status(200).json({ success: true, data: request });
});

export const deleteAccessRequestController = asyncHandler(async (req, res) => {
  const result = await accessService.deleteAccessRequest({
    teamId: req.params.teamId,
    requestId: req.params.requestId,
    requesterId: req.user.id,
  });
  res.status(200).json({ success: true, message: result.message });
});

export const approveAccessRequestController = asyncHandler(async (req, res) => {
  const result = await accessService.approveAccessRequest({
    teamId: req.params.teamId,
    requestId: req.params.requestId,
    reviewerId: req.user.id,
    durationHours: req.body?.durationHours,
  });
  res.status(200).json({ success: true, data: result.request, grant: result.grant });
});

export const rejectAccessRequestController = asyncHandler(async (req, res) => {
  const request = await accessService.rejectAccessRequest({
    teamId: req.params.teamId,
    requestId: req.params.requestId,
    reviewerId: req.user.id,
    reason: req.body?.reason,
  });
  res.status(200).json({ success: true, data: request });
});

export const revokeAccessGrantController = asyncHandler(async (req, res) => {
  const result = await accessService.revokeAccessGrant({
    teamId: req.params.teamId,
    grantId: req.params.grantId,
    revokedBy: req.user.id,
  });
  res.status(200).json({ success: true, message: result.message });
});

export const revokeByRequestIdController = asyncHandler(async (req, res) => {
  const result = await accessService.revokeByRequestId({
    teamId: req.params.teamId,
    requestId: req.params.requestId,
    revokedBy: req.user.id,
  });
  res.status(200).json({ success: true, message: result.message });
});
