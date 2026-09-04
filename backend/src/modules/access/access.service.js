import { emitToTeam, emitToUser } from "../../realtime/event-emitter.js";
import AccessRequest from "./access-request.model.js";
import AccessGrant from "./access-grant.model.js";
import Membership from "../memberships/membership.model.js";
import Permission from "../permissions/permission.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { createNotification } from "../notifications/notification.service.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../common/errors/index.js";


export async function createAccessRequest({
  requesterId,
  targetUserId,
  teamId,
  permissionKey,
  resource,
  reason,
  durationHours,
}) {
  const target = targetUserId || requesterId;

  const activeMembership = await Membership.findOne({
    teamId,
    userId: target,
    status: "ACTIVE",
  });

  if (!activeMembership) {
    throw new BadRequestError("Target user must be an active member of this team");
  }

  if (!permissionKey) {
    throw new BadRequestError("Permission key is required");
  }

  const normalizedKey = permissionKey.toLowerCase().trim();
  const permission = await Permission.findOne({ key: normalizedKey });

  if (!permission) {
    throw new NotFoundError("Permission not found");
  }

  const existingPending = await AccessRequest.findOne({
    targetUserId: target,
    teamId,
    permissionId: permission._id,
    resource,
    status: "PENDING",
  });

  if (existingPending) {
    throw new ConflictError("A pending access request already exists for this permission and resource");
  }

  const expiresAt = durationHours ? new Date(Date.now() + durationHours * 3600000) : null;

  const accessRequest = await AccessRequest.create({
    requesterId,
    targetUserId: target,
    teamId,
    permissionId: permission._id,
    resource,
    reason,
    durationHours,
    expiresAt,
    status: "PENDING",
  });

  // Real-time Event Emission
  emitToTeam(teamId, "access_request:created", { accessRequest });

  // Audit Logging
  logAuditEvent({
    actorId: requesterId,
    action: "access_request.created",
    targetType: "AccessRequest",
    targetId: accessRequest._id,
    teamId,
  });

  return accessRequest;
}

import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";

export async function getAccessRequestsByTeam({ teamId, query = {} }) {
  const { status, targetUserId, page = 1, limit = 20 } = query;

  const filter = { teamId };
  if (status) filter.status = status;
  if (targetUserId) filter.targetUserId = targetUserId;

  const { page: pageNumber, limit: pageSize, skip } = getPaginationParams({ page, limit, defaultLimit: 20 });

  const [requests, total] = await Promise.all([
    AccessRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("requesterId targetUserId permissionId reviewedBy", "name email key"),
    AccessRequest.countDocuments(filter),
  ]);

  return {
    requests,
    total,
    page: pageNumber,
    limit: pageSize,
    totalPages: getTotalPages(total, pageSize),
  };
}

export async function updateAccessRequest({ teamId, requestId, requesterId, updates = {} }) {
  const request = await AccessRequest.findOne({ _id: requestId, teamId });

  if (!request) {
    throw new NotFoundError("Access request not found in this team");
  }

  if (request.requesterId.toString() !== requesterId.toString()) {
    throw new ForbiddenError("You can only edit your own access requests");
  }

  if (request.status !== "PENDING") {
    throw new ConflictError("Only pending access requests can be modified");
  }

  if (updates.reason !== undefined) {
    request.reason = updates.reason;
  }

  if (updates.resource !== undefined) {
    request.resource = updates.resource;
  }

  if (updates.permissionKey) {
    const normalizedKey = updates.permissionKey.toLowerCase().trim();
    const permission = await Permission.findOne({ key: normalizedKey });

    if (!permission) {
      throw new NotFoundError("Permission not found");
    }

    request.permissionId = permission._id;
  }

  if (updates.durationHours !== undefined) {
    request.durationHours = updates.durationHours;
    request.expiresAt = updates.durationHours
      ? new Date(Date.now() + updates.durationHours * 3600000)
      : null;
  }

  await request.save();
  return request;
}

export async function deleteAccessRequest({ teamId, requestId, requesterId }) {
  const request = await AccessRequest.findOne({ _id: requestId, teamId });

  if (!request) {
    throw new NotFoundError("Access request not found in this team");
  }

  if (request.requesterId.toString() !== requesterId.toString()) {
    throw new ForbiddenError("You can only delete your own access requests");
  }

  if (request.status !== "PENDING") {
    throw new ConflictError("Only pending access requests can be deleted");
  }

  await AccessRequest.findOneAndDelete({ _id: requestId, teamId });

  return {
    success: true,
    message: "Access request deleted successfully",
  };
}

export async function approveAccessRequest({ teamId, requestId, reviewerId, durationHours }) {
  const request = await AccessRequest.findOne({ _id: requestId, teamId });

  if (!request) {
    throw new NotFoundError("Access request not found in this team");
  }

  if (request.requesterId.toString() === reviewerId.toString()) {
    logAuditEvent({
      actorId: reviewerId,
      action: "access_request.approve_attempted",
      targetType: "AccessRequest",
      targetId: request._id,
      teamId,
      result: "FAILURE",
      metadata: { reason: "self_approval_attempt" },
    });
    throw new ForbiddenError("Self-approval of access requests is strictly prohibited");
  }

  if (request.status !== "PENDING") {
    throw new ConflictError("Only pending access requests can be approved");
  }

  const effectiveDuration = durationHours !== undefined ? durationHours : request.durationHours;
  const finalExpiresAt = effectiveDuration
    ? new Date(Date.now() + effectiveDuration * 3600000)
    : request.expiresAt;

  request.status = "APPROVED";
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  await request.save();

  const grant = await AccessGrant.create({
    userId: request.targetUserId,
    teamId: request.teamId,
    permissionId: request.permissionId,
    resource: request.resource,
    grantedBy: reviewerId,
    source: "ACCESS_REQUEST",
    accessRequestId: request._id,
    status: "ACTIVE",
    expiresAt: finalExpiresAt,
  });

  // Real-time Event Emissions & Persistent Notification
  emitToUser(request.requesterId, "access_request:resolved", {
    requestId: request._id,
    teamId: request.teamId,
    status: "APPROVED",
    expiresAt: finalExpiresAt,
  });
  emitToUser(request.targetUserId, "access:changed", {
    teamId: request.teamId,
    reason: "GRANT_APPROVED",
  });
  emitToTeam(teamId, "access_request:resolved", {
    requestId: request._id,
    status: "APPROVED",
  });
  createNotification({
    recipientId: request.targetUserId,
    type: "ACCESS_GRANTED",
    title: "Access Request Approved",
    message: "Your access request has been approved.",
    teamId: request.teamId,
    metadata: { grantId: grant._id, expiresAt: finalExpiresAt },
  }).catch((err) => console.error("Failed to persist notification:", err));


  // Audit Logging
  logAuditEvent({
    actorId: reviewerId,
    action: "access_request.approved",
    targetType: "AccessRequest",
    targetId: request._id,
    teamId,
    metadata: {
      grantId: grant._id,
      expiresAt: finalExpiresAt,
    },
  });

  return { request, grant };
}

export async function rejectAccessRequest({ teamId, requestId, reviewerId, reason }) {
  const request = await AccessRequest.findOne({ _id: requestId, teamId });

  if (!request) {
    throw new NotFoundError("Access request not found in this team");
  }

  if (request.requesterId.toString() === reviewerId.toString()) {
    throw new ForbiddenError("Self-rejection is not allowed; use cancel/delete instead");
  }

  if (request.status !== "PENDING") {
    throw new ConflictError("Only pending access requests can be rejected");
  }

  request.status = "REJECTED";
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  if (reason) {
    request.rejectionReason = reason;
  }

  await request.save();

  // Real-time Event Emissions & Persistent Notification
  emitToUser(request.requesterId, "access_request:resolved", {
    requestId: request._id,
    teamId: request.teamId,
    status: "REJECTED",
  });
  emitToTeam(teamId, "access_request:resolved", {
    requestId: request._id,
    status: "REJECTED",
  });
  createNotification({
    recipientId: request.requesterId,
    type: "ACCESS_REQUEST",
    title: "Access Request Rejected",
    message: `Your access request was rejected.${reason ? ` Reason: ${reason}` : ""}`,
    teamId: request.teamId,
  }).catch((err) => console.error("Failed to persist notification:", err));

  // Audit Logging
  logAuditEvent({
    actorId: reviewerId,
    action: "access_request.rejected",
    targetType: "AccessRequest",
    targetId: request._id,
    teamId,
    metadata: { reason },
  });

  return request;
}

export async function revokeAccessGrant({ teamId, grantId, revokedBy }) {
  const grant = await AccessGrant.findOne({ _id: grantId, teamId, status: "ACTIVE" });

  if (!grant) {
    throw new NotFoundError("Active access grant not found in this team");
  }

  grant.status = "REVOKED";
  grant.revokedBy = revokedBy;
  grant.revokedAt = new Date();

  await grant.save();

  // Real-time Event Emissions & Persistent Notification
  emitToUser(grant.userId, "access_grant:revoked", {
    grantId: grant._id,
    teamId,
    permissionId: grant.permissionId,
  });
  emitToUser(grant.userId, "access:changed", {
    teamId,
    reason: "GRANT_REVOKED",
  });
  emitToTeam(teamId, "access_grant:revoked", {
    grantId: grant._id,
    userId: grant.userId,
  });

  createNotification({
    recipientId: grant.userId,
    type: "ACCESS_REVOKED",
    title: "Access Grant Revoked",
    message: "Your temporary/direct access grant has been revoked.",
    teamId,
  }).catch((err) => console.error("Failed to persist notification:", err));


  // Audit Logging
  logAuditEvent({
    actorId: revokedBy,
    action: "access_grant.revoked",
    targetType: "AccessGrant",
    targetId: grant._id,
    teamId,
  });

  return {
    success: true,
    message: "Access grant revoked successfully",
  };
}

export async function getAccessRequestById({ teamId, requestId }) {
  const request = await AccessRequest.findOne({ _id: requestId, teamId })
    .populate("requesterId targetUserId permissionId reviewedBy", "name email key");
  if (!request) {
    throw new NotFoundError("Access request not found in this team");
  }
  return request;
}

export async function getActiveTemporaryGrant({ teamId, userId }) {
  return AccessGrant.findOne({
    teamId,
    userId,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() },
  });
}