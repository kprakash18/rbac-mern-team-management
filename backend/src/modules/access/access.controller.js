import * as accessService from "./access.service.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";

export async function createAccessRequestController(req, res, next) {
  try {
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

    return res.status(201).json({
      success: true,
      data: accessRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllAccessRequestsController(req, res, next) {
  try {
    const viewerId = req.user.id;
    const result = await accessService.getAllAccessRequests({
      query: req.query,
      viewerId,
    });

    return res.status(200).json({
      success: true,
      data: result.requests,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAccessRequestsByTeamController(req, res, next) {
  try {
    const { teamId } = req.params;
    const viewerId = req.user.id;

    // Determine if the viewer is a Team Admin or Super Admin
    let viewerIsAdmin = Boolean(req.user.isSuperAdmin);
    if (!viewerIsAdmin) {
      const membership = await Membership.findOne({ userId: viewerId, teamId, status: "ACTIVE" });
      if (membership) {
        const adminRole = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" }).select("_id");
        if (adminRole) {
          const isTeamAdmin = await MembershipRole.exists({
            membershipId: membership._id,
            roleId: adminRole._id,
            revokedAt: null,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          });
          viewerIsAdmin = Boolean(isTeamAdmin);
        }
      }
    }

    const result = await accessService.getAccessRequestsByTeam({
      teamId,
      query: req.query,
      viewerId,
      viewerIsAdmin,
    });

    return res.status(200).json({
      success: true,
      data: result.requests,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAccessRequestByIdController(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const request = await accessService.getAccessRequestById({ teamId, requestId });

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAccessRequestController(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const requesterId = req.user.id;

    const request = await accessService.updateAccessRequest({
      teamId,
      requestId,
      requesterId,
      updates: req.body,
    });

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccessRequestController(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const requesterId = req.user.id;

    const result = await accessService.deleteAccessRequest({
      teamId,
      requestId,
      requesterId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveAccessRequestController(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const reviewerId = req.user.id;
    const { durationHours } = req.body ?? {};

    const result = await accessService.approveAccessRequest({
      teamId,
      requestId,
      reviewerId,
      durationHours,
    });

    return res.status(200).json({
      success: true,
      data: result.request,
      grant: result.grant,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectAccessRequestController(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const reviewerId = req.user.id;
    const { reason } = req.body ?? {};

    const request = await accessService.rejectAccessRequest({
      teamId,
      requestId,
      reviewerId,
      reason,
    });

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeAccessGrantController(req, res, next) {
  try {
    const { teamId, grantId } = req.params;
    const revokedBy = req.user.id;

    const result = await accessService.revokeAccessGrant({
      teamId,
      grantId,
      revokedBy,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeByRequestIdController(req, res, next) {
  try {
    const { teamId, requestId } = req.params;
    const revokedBy = req.user.id;

    const result = await accessService.revokeByRequestId({
      teamId,
      requestId,
      revokedBy,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
