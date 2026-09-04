import * as accessService from "./access.service.js";

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

export async function getAccessRequestsByTeamController(req, res, next) {
  try {
    const { teamId } = req.params;
    const result = await accessService.getAccessRequestsByTeam({
      teamId,
      query: req.query,
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
