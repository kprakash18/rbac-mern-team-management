import mongoose from "mongoose";
import { emitToTeam, emitToUser } from "../../realtime/event-emitter.js";
import AccessRequest from "./access-request.model.js";
import AccessGrant from "./access-grant.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Permission from "../permissions/permission.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { createNotification, createTargetedNotifications } from "../notifications/notification.service.js";
import { can, isSuperAdmin, getAllSuperAdminUserIds } from "../authorization/authorization.service.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../common/errors/index.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";


export async function createAccessRequest({
  requesterId,
  targetUserId,
  teamId,
  permissionKey,
  permissionId,
  resource,
  reason,
  durationHours,
  durationMinutes,
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

  let permission = null;
  if (permissionId && mongoose.Types.ObjectId.isValid(permissionId)) {
    permission = await Permission.findById(permissionId);
  }
  if (!permission && permissionKey) {
    const normalizedKey = permissionKey.toLowerCase().trim();
    permission = await Permission.findOne({ key: normalizedKey });
  }

  if (!permission) {
    throw new NotFoundError("Permission not found");
  }

  const effectiveHours = durationHours || (durationMinutes ? durationMinutes / 60 : 2);
  const expiresAt = effectiveHours ? new Date(Date.now() + effectiveHours * 3600000) : null;
  const resourceKey = resource || "*";

  const existingPending = await AccessRequest.findOne({
    targetUserId: target,
    teamId,
    permissionId: permission._id,
    resource: resourceKey,
    status: "PENDING",
  });

  if (existingPending) {
    throw new ConflictError("A pending access request already exists for this permission and resource");
  }

  // Determine approvalLevel: Team Admin requests must be approved by Super Admin
  let approvalLevel = "TEAM_ADMIN";
  const requesterMembershipForLevel = await Membership.findOne({ userId: requesterId, teamId, status: "ACTIVE" });
  if (requesterMembershipForLevel) {
    const teamAdminRoleForLevel = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" }).select("_id");
    if (teamAdminRoleForLevel) {
      const isRequesterTeamAdmin = await MembershipRole.exists({
        membershipId: requesterMembershipForLevel._id,
        roleId: teamAdminRoleForLevel._id,
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });
      if (isRequesterTeamAdmin) approvalLevel = "SUPER_ADMIN";
    }
  }

  const accessRequest = await AccessRequest.create({
    requesterId,
    targetUserId: target,
    teamId,
    permissionId: permission._id,
    resource: resourceKey,
    reason,
    durationHours: effectiveHours,
    expiresAt,
    status: "PENDING",
    approvalLevel,
  });

  // Notify appropriate reviewers of the new JIT access request
  try {
    const [requester, teamDoc] = await Promise.all([
      User.findById(requesterId).select("name email"),
      Team.findById(teamId).select("name"),
    ]);
    const requesterName = requester?.name || "A team member";
    const teamName = teamDoc?.name || "Workspace";
    const permLabel = permission.name || permission.key;

    // Check if the requester is a Team Admin
    const isTeamAdminRequester = approvalLevel === "SUPER_ADMIN";

    let recipientUserIds = [];

    if (isTeamAdminRequester) {
      // Team Admin JIT → notify all Super Admins globally
      recipientUserIds = await getAllSuperAdminUserIds();
    } else {
      // Regular member JIT → notify Team Admins in this team
      const adminRole = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" }).select("_id");
      if (adminRole) {
        const adminMemberRoles = await MembershipRole.find({
          roleId: adminRole._id,
          revokedAt: null,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        }).select("membershipId");
        const adminMemberships = await Membership.find({
          _id: { $in: adminMemberRoles.map((m) => m.membershipId) },
          teamId,
          status: "ACTIVE",
        }).select("userId");
        recipientUserIds = adminMemberships.map((m) => m.userId.toString());
      }
    }

    const uniqueRecipients = Array.from(new Set(recipientUserIds)).filter(
      (id) => String(id) !== String(requesterId)
    );

    // Targeted real-time emission only to designated approvers
    for (const recipientUserId of uniqueRecipients) {
      emitToUser(recipientUserId, "access_request:created", { accessRequest });

      createNotification({
        recipientId: recipientUserId,
        actorId: requesterId,
        type: "ACCESS_REQUEST",
        teamId,
        resourceType: "ACCESS_REQUEST",
        resourceId: accessRequest._id,
        metadata: {
          requestId: accessRequest._id,
          teamId,
          teamName,
          requesterName,
          permissionKey: permission.key,
          permissionName: permLabel,
          routedToSuperAdmin: isTeamAdminRequester,
        },
        title: "New JIT Access Request",
        message: isTeamAdminRequester
          ? `${requesterName} (Team Admin) requested temporary access for '${permLabel}' in ${teamName}.`
          : `${requesterName} requested temporary access for '${permLabel}' in ${teamName}.`,
      })
        .then((notifDoc) => {
          emitToUser(recipientUserId, "notification:new", notifDoc);
        })
        .catch((err) => console.error("Failed to persist access request notification:", err));
    }
  } catch (err) {
    console.error("Failed to notify reviewers of access request:", err);
  }

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

/**
 * Fetch all access requests across all teams (used by Super Admin global view)
 * Strictly defaults to approvalLevel: "SUPER_ADMIN" so regular member requests never leak to Super Admin
 */
export async function getAllAccessRequests({ query = {}, viewerId } = {}) {
  const { status, teamId, approvalLevel, page = 1, limit = 50 } = query;

  const filter = {};
  if (status && status !== "ALL") filter.status = status;
  if (teamId && teamId !== "ALL") filter.teamId = teamId;

  if (approvalLevel && approvalLevel !== "ALL") {
    filter.approvalLevel = approvalLevel;
  } else if (!approvalLevel) {
    filter.approvalLevel = "SUPER_ADMIN";
  }

  const { page: pageNumber, limit: pageSize, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });

  const [requests, total] = await Promise.all([
    AccessRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("requesterId targetUserId reviewedBy", "name email")
      .populate("permissionId", "name key category")
      .populate("teamId", "name description"),
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

export async function getAccessRequestsByTeam({ teamId, query = {}, viewerId, viewerIsAdmin = false }) {
  const { status, targetUserId, page = 1, limit = 50 } = query;

  const filter = { teamId };
  if (status && status !== "ALL") filter.status = status;

  if (viewerIsAdmin) {
    if (targetUserId) {
      filter.targetUserId = targetUserId;
    } else {
      // Team Admins see requests needing TEAM_ADMIN approval, OR requests they themselves created
      filter.$or = [
        { approvalLevel: "TEAM_ADMIN" },
        { requesterId: viewerId },
      ];
    }
  } else {
    // Non-admins only ever see their own requests
    filter.requesterId = viewerId;
  }

  const { page: pageNumber, limit: pageSize, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });

  const [requests, total] = await Promise.all([
    AccessRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("requesterId targetUserId reviewedBy", "name email")
      .populate("permissionId", "name key category")
      .populate("teamId", "name description"),
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
  const query = { _id: requestId };
  if (teamId) query.teamId = teamId;
  const request = await AccessRequest.findOne(query);

  if (!request) {
    throw new NotFoundError("Access request not found");
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
  const query = { _id: requestId };
  if (teamId) query.teamId = teamId;
  const request = await AccessRequest.findOne(query);

  if (!request) {
    throw new NotFoundError("Access request not found");
  }

  const effectiveTeamId = request.teamId;
  const isOwner = request.requesterId.toString() === requesterId.toString();
  const reviewerIsSuperAdmin = await isSuperAdmin(requesterId);
  const hasCancelPermission =
    reviewerIsSuperAdmin ||
    (await can(requesterId, effectiveTeamId, "access_request.cancel")) ||
    (await can(requesterId, effectiveTeamId, "access_grant.revoke"));

  if (!isOwner && !hasCancelPermission) {
    throw new ForbiddenError("You can only delete your own access requests or you need admin cancellation permissions");
  }

  // If the request was APPROVED, also revoke any associated active grant
  if (request.status === "APPROVED") {
    await AccessGrant.updateMany(
      { accessRequestId: request._id, status: "ACTIVE" },
      { $set: { status: "REVOKED", revokedAt: new Date(), revokedBy: requesterId } }
    );
    request.status = "REVOKED";
    await request.save();

    let teamName = "Workspace";
    try {
      const teamDoc = await Team.findById(effectiveTeamId).select("name");
      if (teamDoc?.name) teamName = teamDoc.name;
    } catch {}

    emitToUser(request.requesterId, "access_request:resolved", {
      requestId: request._id,
      teamId: effectiveTeamId,
      status: "REVOKED",
    });
    emitToUser(request.targetUserId || request.requesterId, "access:changed", {
      teamId: effectiveTeamId,
      reason: "GRANT_REVOKED",
    });
    emitToTeam(effectiveTeamId, "access_request:resolved", { requestId: request._id, status: "REVOKED" });

    if (request.requesterId.toString() !== requesterId.toString()) {
      createNotification({
        recipientId: request.requesterId,
        actorId: requesterId,
        type: "ACCESS_REVOKED",
        teamId: effectiveTeamId,
        resourceType: "ACCESS_REQUEST",
        resourceId: request._id,
        metadata: {
          requestId: request._id,
          teamName,
          details: "Your active JIT access grant has been revoked by an administrator.",
        },
        title: "JIT Access Revoked",
        message: `Your active JIT access grant in ${teamName} has been revoked by an administrator.`,
      })
        .then((notifDoc) => emitToUser(request.requesterId, "notification:new", notifDoc))
        .catch((err) => console.error("Failed to persist revocation notification:", err));
    }

    return {
      success: true,
      message: "Active JIT grant revoked successfully",
    };
  }

  await AccessRequest.findOneAndDelete({ _id: requestId });
  emitToUser(request.requesterId, "access_request:deleted", { requestId, teamId: effectiveTeamId });
  emitToTeam(effectiveTeamId, "access_request:deleted", { requestId, teamId: effectiveTeamId });

  if (request.requesterId.toString() !== requesterId.toString()) {
    createNotification({
      recipientId: request.requesterId,
      actorId: requesterId,
      type: "ACCESS_CANCELLED",
      teamId: effectiveTeamId,
      resourceType: "ACCESS_REQUEST",
      resourceId: request._id,
      metadata: {
        requestId: request._id,
        status: "CANCELLED",
      },
      title: "JIT Access Request Cancelled",
      message: "Your pending JIT access request was cancelled by an administrator.",
    })
      .then((notifDoc) => emitToUser(request.requesterId, "notification:new", notifDoc))
      .catch((err) => console.error("Failed to persist cancellation notification:", err));
  }

  return {
    success: true,
    message: "Access request deleted successfully",
  };
}

export async function approveAccessRequest({ teamId, requestId, reviewerId, durationHours }) {
  const query = { _id: requestId };
  if (teamId) query.teamId = teamId;
  const request = await AccessRequest.findOne(query);

  if (!request) {
    throw new NotFoundError("Access request not found");
  }

  if (request.status !== "PENDING") {
    throw new ConflictError("Only pending access requests can be approved");
  }

  // Prevent self-approval (Administrators cannot approve their own JIT requests)
  if (request.requesterId.toString() === reviewerId.toString()) {
    throw new ForbiddenError(
      "Self-approval is forbidden. You cannot approve your own JIT access request.",
      "SELF_APPROVAL_FORBIDDEN"
    );
  }

  const effectiveTeamId = request.teamId;
  const targetUserId = request.targetUserId || request.requesterId;
  const resourceKey = request.resource || "*";

  // Enforce approval hierarchy:
  // If the requester is a Team Admin, only a Super Admin may approve their JIT request.
  const requesterMembership = await Membership.findOne({ userId: request.requesterId, teamId: effectiveTeamId, status: "ACTIVE" });
  if (requesterMembership) {
    const teamAdminRole = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" }).select("_id");
    if (teamAdminRole) {
      const requesterIsTeamAdmin = await MembershipRole.exists({
        membershipId: requesterMembership._id,
        roleId: teamAdminRole._id,
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });
      if (requesterIsTeamAdmin) {
        const reviewerIsSuperAdmin = await isSuperAdmin(reviewerId);
        if (!reviewerIsSuperAdmin) {
          throw new ForbiddenError(
            "JIT access requests from Team Admins can only be approved by a Super Admin.",
            "SUPER_ADMIN_APPROVAL_REQUIRED"
          );
        }
      }
    }
  }

  let permissionId = request.permissionId;
  let permissionDoc = null;
  if (permissionId && mongoose.Types.ObjectId.isValid(permissionId)) {
    permissionDoc = await Permission.findById(permissionId).select("name key");
  }
  if (!permissionId || !mongoose.Types.ObjectId.isValid(permissionId)) {
    const defaultPerm = await Permission.findOne({});
    permissionId = defaultPerm?._id;
    permissionDoc = defaultPerm;
  }

  const effectiveHours = typeof durationHours === "number" ? durationHours : (typeof request.durationHours === "number" ? request.durationHours : 2);
  const finalExpiresAt = new Date(Date.now() + effectiveHours * 3600000);

  request.status = "APPROVED";
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  request.expiresAt = finalExpiresAt;
  await request.save();

  // Find existing grant or create a new active one
  let grant = await AccessGrant.findOne({
    userId: targetUserId,
    teamId: effectiveTeamId,
    permissionId: permissionId,
    resource: resourceKey,
  });

  if (grant) {
    grant.status = "ACTIVE";
    grant.grantedBy = reviewerId;
    grant.source = "ACCESS_REQUEST";
    grant.accessRequestId = request._id;
    grant.expiresAt = finalExpiresAt;
    grant.revokedAt = null;
    grant.revokedBy = null;
    await grant.save();
  } else {
    grant = await AccessGrant.create({
      userId: targetUserId,
      teamId: effectiveTeamId,
      permissionId: permissionId,
      resource: resourceKey,
      grantedBy: reviewerId,
      source: "ACCESS_REQUEST",
      accessRequestId: request._id,
      status: "ACTIVE",
      expiresAt: finalExpiresAt,
    });
  }

  const permLabel = permissionDoc?.name || permissionDoc?.key || "resource";

  // Fetch Team name for notification
  let teamName = "Workspace";
  try {
    const teamDoc = await Team.findById(effectiveTeamId).select("name");
    if (teamDoc?.name) teamName = teamDoc.name;
  } catch {}

  // Real-time Event Emissions & Persistent Notification to Requester
  try {
    emitToUser(request.requesterId, "access_request:resolved", {
      requestId: request._id,
      teamId: effectiveTeamId,
      status: "APPROVED",
      expiresAt: finalExpiresAt,
    });
    emitToUser(targetUserId, "access:changed", {
      teamId: effectiveTeamId,
      reason: "GRANT_APPROVED",
    });
    emitToTeam(effectiveTeamId, "access_request:resolved", {
      requestId: request._id,
      status: "APPROVED",
    });

    // Notify requester (Team Admin or Member)
    createNotification({
      recipientId: request.requesterId,
      actorId: reviewerId,
      type: "ACCESS_GRANTED",
      teamId: effectiveTeamId,
      resourceType: "ACCESS_REQUEST",
      resourceId: request._id,
      metadata: {
        permissionName: permLabel,
        grantId: grant._id,
        requestId: request._id,
        teamName,
        expiresAt: finalExpiresAt,
        details: `Your access request for '${permLabel}' in ${teamName} has been approved.`,
      },
      title: "JIT Access Approved",
      message: `Your access request for '${permLabel}' in ${teamName} has been approved. Lease active until ${finalExpiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    })
      .then((notifDoc) => {
        emitToUser(request.requesterId, "notification:new", notifDoc);
      })
      .catch((err) => console.error("Failed to persist approval notification:", err));
  } catch (err) {
    console.error("Error dispatching access request approval events:", err);
  }

  // Audit Logging
  logAuditEvent({
    actorId: reviewerId,
    action: "access_request.approved",
    targetType: "AccessRequest",
    targetId: request._id,
    teamId: effectiveTeamId,
    metadata: {
      grantId: grant._id,
      expiresAt: finalExpiresAt,
    },
  });

  return { request, grant };
}

export async function rejectAccessRequest({ teamId, requestId, reviewerId, reason }) {
  const query = { _id: requestId };
  if (teamId) query.teamId = teamId;
  const request = await AccessRequest.findOne(query);

  if (!request) {
    throw new NotFoundError("Access request not found");
  }

  if (request.requesterId.toString() === reviewerId.toString()) {
    throw new ForbiddenError("Self-rejection is not allowed; use cancel/delete instead");
  }

  if (request.status !== "PENDING") {
    throw new ConflictError("Only pending access requests can be rejected");
  }

  const effectiveTeamId = request.teamId;

  request.status = "REJECTED";
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  if (reason) {
    request.rejectionReason = reason;
  }

  await request.save();

  // Resolve permission name for notification
  let rejectedPermLabel = "resource";
  if (request.permissionId && mongoose.Types.ObjectId.isValid(request.permissionId)) {
    const rejectedPerm = await Permission.findById(request.permissionId).select("name key");
    if (rejectedPerm) {
      rejectedPermLabel = rejectedPerm.name || rejectedPerm.key || "resource";
    }
  }

  let teamName = "Workspace";
  try {
    const teamDoc = await Team.findById(effectiveTeamId).select("name");
    if (teamDoc?.name) teamName = teamDoc.name;
  } catch {}

  // Real-time Event Emissions & Notification to Requester
  emitToUser(request.requesterId, "access_request:resolved", {
    requestId: request._id,
    teamId: effectiveTeamId,
    status: "REJECTED",
  });
  emitToTeam(effectiveTeamId, "access_request:resolved", {
    requestId: request._id,
    status: "REJECTED",
  });

  createNotification({
    recipientId: request.requesterId,
    actorId: reviewerId,
    type: "ACCESS_REJECTED",
    teamId: effectiveTeamId,
    resourceType: "ACCESS_REQUEST",
    resourceId: request._id,
    metadata: {
      requestId: request._id,
      permissionName: rejectedPermLabel,
      teamName,
      reason,
      status: "REJECTED",
    },
    title: "JIT Access Request Rejected",
    message: `Your access request for '${rejectedPermLabel}' in ${teamName} was rejected.${reason ? ` Reason: ${reason}` : ""}`,
  })
    .then((notifDoc) => {
      emitToUser(request.requesterId, "notification:new", notifDoc);
    })
    .catch((err) => console.error("Failed to persist rejection notification:", err));

  // Audit Logging
  logAuditEvent({
    actorId: reviewerId,
    action: "access_request.rejected",
    targetType: "AccessRequest",
    targetId: request._id,
    teamId: effectiveTeamId,
    metadata: { reason },
  });

  return request;
}

export async function revokeByRequestId({ teamId, requestId, revokedBy }) {
  const query = { _id: requestId };
  if (teamId) query.teamId = teamId;
  const request = await AccessRequest.findOne(query);

  if (!request) {
    throw new NotFoundError("Access request not found");
  }

  if (request.status !== "APPROVED") {
    throw new ConflictError("Only approved (active) access requests can have their grant revoked");
  }

  const effectiveTeamId = request.teamId;

  // Find the linked active grant via accessRequestId first, then fallback
  const grant = await AccessGrant.findOne({ accessRequestId: request._id, status: "ACTIVE" })
    || await AccessGrant.findOne({
        userId: request.targetUserId || request.requesterId,
        teamId: effectiveTeamId,
        permissionId: request.permissionId,
        status: "ACTIVE",
      });

  if (!grant) {
    throw new NotFoundError("No active access grant found for this request");
  }

  grant.status = "REVOKED";
  grant.revokedBy = revokedBy;
  grant.revokedAt = new Date();
  await grant.save();

  request.status = "REVOKED";
  await request.save();

  let teamName = "Workspace";
  try {
    const teamDoc = await Team.findById(effectiveTeamId).select("name");
    if (teamDoc?.name) teamName = teamDoc.name;
  } catch {}

  emitToUser(grant.userId, "access_grant:revoked", { grantId: grant._id, teamId: effectiveTeamId });
  emitToUser(grant.userId, "access:changed", { teamId: effectiveTeamId, reason: "GRANT_REVOKED" });
  emitToUser(request.requesterId, "access_request:resolved", {
    requestId: request._id,
    teamId: effectiveTeamId,
    status: "REVOKED",
  });
  emitToTeam(effectiveTeamId, "access_request:resolved", { requestId: request._id, status: "REVOKED" });
  emitToTeam(effectiveTeamId, "access_grant:revoked", { grantId: grant._id, requestId: request._id, userId: grant.userId });

  createNotification({
    recipientId: request.requesterId,
    actorId: revokedBy,
    type: "ACCESS_REVOKED",
    teamId: effectiveTeamId,
    resourceType: "ACCESS_REQUEST",
    resourceId: request._id,
    metadata: {
      requestId: request._id,
      grantId: grant._id,
      teamName,
      details: "Your temporary JIT access grant has been revoked early by an administrator.",
    },
    title: "JIT Access Revoked",
    message: `Your temporary JIT access grant in ${teamName} has been revoked early by an administrator.`,
  })
    .then((notifDoc) => {
      emitToUser(request.requesterId, "notification:new", notifDoc);
    })
    .catch((err) => console.error("Failed to persist revoke notification:", err));

  logAuditEvent({
    actorId: revokedBy,
    action: "access_grant.revoked",
    targetType: "AccessGrant",
    targetId: grant._id,
    teamId: effectiveTeamId,
  });

  return { success: true, message: "JIT lease revoked successfully" };
}

export async function revokeAccessGrant({ teamId, grantId, revokedBy }) {
  const query = { _id: grantId, status: "ACTIVE" };
  if (teamId) query.teamId = teamId;
  const grant = await AccessGrant.findOne(query);

  if (!grant) {
    throw new NotFoundError("Active access grant not found");
  }

  const effectiveTeamId = grant.teamId;

  grant.status = "REVOKED";
  grant.revokedBy = revokedBy;
  grant.revokedAt = new Date();

  await grant.save();

  let teamName = "Workspace";
  try {
    const teamDoc = await Team.findById(effectiveTeamId).select("name");
    if (teamDoc?.name) teamName = teamDoc.name;
  } catch {}

  // Real-time Event Emissions & Persistent Notification
  emitToUser(grant.userId, "access_grant:revoked", {
    grantId: grant._id,
    teamId: effectiveTeamId,
    permissionId: grant.permissionId,
  });
  emitToUser(grant.userId, "access:changed", {
    teamId: effectiveTeamId,
    reason: "GRANT_REVOKED",
  });
  emitToTeam(effectiveTeamId, "access_grant:revoked", {
    grantId: grant._id,
    userId: grant.userId,
  });

  createNotification({
    recipientId: grant.userId,
    actorId: revokedBy,
    type: "ACCESS_REVOKED",
    teamId: effectiveTeamId,
    resourceType: "ACCESS_GRANT",
    resourceId: grant._id,
    metadata: {
      grantId: grant._id,
      teamName,
      details: "Your temporary/direct access grant has been revoked.",
    },
    title: "JIT Access Revoked",
    message: `Your temporary access grant in ${teamName} has been revoked.`,
  })
    .then((notifDoc) => {
      emitToUser(grant.userId, "notification:new", notifDoc);
    })
    .catch((err) => console.error("Failed to persist notification:", err));

  // Audit Logging
  logAuditEvent({
    actorId: revokedBy,
    action: "access_grant.revoked",
    targetType: "AccessGrant",
    targetId: grant._id,
    teamId: effectiveTeamId,
  });

  return {
    success: true,
    message: "Access grant revoked successfully",
  };
}

export async function getAccessRequestById({ teamId, requestId }) {
  const query = { _id: requestId };
  if (teamId) query.teamId = teamId;
  const request = await AccessRequest.findOne(query)
    .populate("requesterId targetUserId reviewedBy", "name email")
    .populate("permissionId", "name key category")
    .populate("teamId", "name description");
  if (!request) {
    throw new NotFoundError("Access request not found");
  }
  return request;
}

export async function getActiveTemporaryGrant({ teamId, userId }) {
  const query = {
    userId,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() },
  };
  if (teamId) query.teamId = teamId;
  return AccessGrant.findOne(query);
}