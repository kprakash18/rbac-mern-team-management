import mongoose from "mongoose";
import { emitToTeam, emitToUser } from "../../realtime/event-emitter.js";
import AccessRequest from "./access-request.model.js";
import AccessGrant from "./access-grant.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";
import User from "../users/user.model.js";
import Permission from "../permissions/permission.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { createNotification, createTargetedNotifications } from "../notifications/notification.service.js";
import { can } from "../authorization/authorization.service.js";
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
    const teamAdminRoleForLevel = await Role.findOne({ name: "Team Admin" }).select("_id");
    if (teamAdminRoleForLevel) {
      const isRequesterTeamAdmin = await MembershipRole.exists({
        membershipId: requesterMembershipForLevel._id,
        roleId: teamAdminRoleForLevel._id,
        revokedAt: null,
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

  // Real-time Event Emission
  emitToTeam(teamId, "access_request:created", { accessRequest });

  // Notify appropriate reviewers of the new JIT access request
  try {
    const requester = await User.findById(requesterId).select("name");
    const requesterName = requester?.name || "A team member";

    // Check if the requester is a Team Admin — if so, route to Super Admins globally
    const requesterMembership = await Membership.findOne({ userId: requesterId, teamId, status: "ACTIVE" });
    const requesterIsTeamAdmin = requesterMembership
      ? await (async () => {
          const adminRole = await Role.findOne({ name: "Team Admin" }).select("_id");
          if (!adminRole) return false;
          const mr = await MembershipRole.findOne({ membershipId: requesterMembership._id, roleId: adminRole._id, revokedAt: null });
          return Boolean(mr);
        })()
      : false;

    let recipientUserIds = [];

    if (requesterIsTeamAdmin) {
      // Team Admin JIT → notify all Super Admins globally (not scoped to this team)
      const superAdminRole = await Role.findOne({ name: "Super Admin" }).select("_id");
      if (superAdminRole) {
        const superAdminMemberRoles = await MembershipRole.find({ roleId: superAdminRole._id, revokedAt: null }).select("membershipId");
        const superAdminMemberships = await Membership.find({
          _id: { $in: superAdminMemberRoles.map((m) => m.membershipId) },
          status: "ACTIVE",
        }).select("userId");
        recipientUserIds = superAdminMemberships.map((m) => m.userId);
      }
    } else {
      // Regular member JIT → notify Team Admins in this team
      const adminRole = await Role.findOne({ name: "Team Admin" }).select("_id");
      if (adminRole) {
        const adminMemberRoles = await MembershipRole.find({ roleId: adminRole._id, revokedAt: null }).select("membershipId");
        const adminMemberships = await Membership.find({
          _id: { $in: adminMemberRoles.map((m) => m.membershipId) },
          teamId,
          status: "ACTIVE",
        }).select("userId");
        recipientUserIds = adminMemberships.map((m) => m.userId);
      }
    }

    for (const recipientUserId of recipientUserIds) {
      if (String(recipientUserId) !== String(requesterId)) {
        createNotification({
          recipientId: recipientUserId,
          actorId: requesterId,
          type: "ACCESS_REQUEST",
          teamId,
          resourceType: "ACCESS_REQUEST",
          resourceId: accessRequest._id,
          metadata: {
            requestId: accessRequest._id,
            requesterName,
            permissionKey: permission.key,
            routedToSuperAdmin: requesterIsTeamAdmin,
          },
          title: "New JIT Access Request",
          message: `${requesterName} requested temporary access for '${permission.key}'.`,
        }).catch((err) => console.error("Failed to persist access request notification:", err));
      }
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

  const isOwner = request.requesterId.toString() === requesterId.toString();
  const hasCancelPermission =
    (await can(requesterId, teamId, "access_request.cancel")) ||
    (await can(requesterId, teamId, "access_grant.revoke"));

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
    emitToTeam(teamId, "access_request:resolved", { requestId: request._id, status: "REVOKED" });
    return {
      success: true,
      message: "Active JIT grant revoked successfully",
    };
  }

  await AccessRequest.findOneAndDelete({ _id: requestId, teamId });
  emitToTeam(teamId, "access_request:deleted", { requestId, teamId });

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

  if (request.status !== "PENDING") {
    throw new ConflictError("Only pending access requests can be approved");
  }

  const targetUserId = request.targetUserId || request.requesterId;
  const resourceKey = request.resource || "*";

  // Enforce approval hierarchy:
  // If the requester is a Team Admin, only a Super Admin may approve their JIT request.
  const requesterMembership = await Membership.findOne({ userId: request.requesterId, teamId, status: "ACTIVE" });
  if (requesterMembership) {
    const teamAdminRole = await Role.findOne({ name: "Team Admin" }).select("_id");
    if (teamAdminRole) {
      const requesterIsTeamAdmin = await MembershipRole.exists({
        membershipId: requesterMembership._id,
        roleId: teamAdminRole._id,
        revokedAt: null,
      });
      if (requesterIsTeamAdmin) {
        // Reviewer must be a Super Admin
        const superAdminRole = await Role.findOne({ name: "Super Admin" }).select("_id");
        const reviewerIsSuperAdmin = superAdminRole
          ? await (async () => {
              const reviewerMemberRoles = await MembershipRole.find({ roleId: superAdminRole._id, revokedAt: null }).select("membershipId");
              const reviewerMemberships = await Membership.find({
                _id: { $in: reviewerMemberRoles.map((m) => m.membershipId) },
                userId: reviewerId,
                status: "ACTIVE",
              });
              return reviewerMemberships.length > 0;
            })()
          : false;
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
  if (!permissionId || !mongoose.Types.ObjectId.isValid(permissionId)) {
    const defaultPerm = await Permission.findOne({});
    permissionId = defaultPerm?._id;
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
    teamId: request.teamId,
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
      teamId: request.teamId,
      permissionId: permissionId,
      resource: resourceKey,
      grantedBy: reviewerId,
      source: "ACCESS_REQUEST",
      accessRequestId: request._id,
      status: "ACTIVE",
      expiresAt: finalExpiresAt,
    });
  }

  // Real-time Event Emissions & Persistent Notification
  try {
    emitToUser(request.requesterId, "access_request:resolved", {
      requestId: request._id,
      teamId: request.teamId,
      status: "APPROVED",
      expiresAt: finalExpiresAt,
    });
    emitToUser(targetUserId, "access:changed", {
      teamId: request.teamId,
      reason: "GRANT_APPROVED",
    });
    emitToTeam(teamId, "access_request:resolved", {
      requestId: request._id,
      status: "APPROVED",
    });
    createTargetedNotifications({
      recipients: [targetUserId],
      actorId: reviewerId,
      type: "USER_ACCESS_CHANGED",
      teamId: request.teamId,
      resourceType: "ACCESS_REQUEST",
      resourceId: request._id,
      metadata: {
        permissionName: permission?.name,
        grantId: grant._id,
        requestId: request._id,
        expiresAt: finalExpiresAt,
        details: `Your access request for '${permission?.name || "resource"}' has been approved.`,
      },
      title: "Access Permissions Changed",
      message: `Your access request for '${permission?.name || "resource"}' has been approved.`,
    }).catch((err) => console.error("Failed to persist notification:", err));
  } catch (err) {
    console.error("Error dispatching access request approval events:", err);
  }

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
    actorId: reviewerId,
    type: "ACCESS_REQUEST",
    teamId: request.teamId,
    resourceType: "ACCESS_REQUEST",
    resourceId: request._id,
    metadata: {
      requestId: request._id,
      reason,
      status: "REJECTED",
    },
    title: "Access Request Rejected",
    message: `Your access request was rejected.${reason ? ` Reason: ${reason}` : ""}`,
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

export async function revokeByRequestId({ teamId, requestId, revokedBy }) {
  const request = await AccessRequest.findOne({ _id: requestId, teamId });

  if (!request) {
    throw new NotFoundError("Access request not found in this team");
  }

  if (request.status !== "APPROVED") {
    throw new ConflictError("Only approved (active) access requests can have their grant revoked");
  }

  // Find the linked active grant via accessRequestId first, then fallback
  const grant = await AccessGrant.findOne({ accessRequestId: request._id, status: "ACTIVE" })
    || await AccessGrant.findOne({
        userId: request.targetUserId || request.requesterId,
        teamId,
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

  emitToUser(grant.userId, "access_grant:revoked", { grantId: grant._id, teamId });
  emitToTeam(teamId, "access_grant:revoked", { grantId: grant._id, requestId: request._id, userId: grant.userId });

  createTargetedNotifications({
    recipients: [request.requesterId],
    actorId: revokedBy,
    type: "USER_ACCESS_CHANGED",
    teamId,
    resourceType: "ACCESS_REQUEST",
    resourceId: request._id,
    metadata: {
      requestId: request._id,
      grantId: grant._id,
      details: "Your temporary JIT access grant has been revoked early by an administrator.",
    },
    title: "Access Permissions Changed",
    message: "Your temporary JIT access grant has been revoked early by an administrator.",
  }).catch((err) => console.error("Failed to persist revoke notification:", err));

  logAuditEvent({
    actorId: revokedBy,
    action: "access_grant.revoked",
    targetType: "AccessGrant",
    targetId: grant._id,
    teamId,
  });

  return { success: true, message: "JIT lease revoked successfully" };
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

  createTargetedNotifications({
    recipients: [grant.userId],
    actorId: revokedBy,
    type: "USER_ACCESS_CHANGED",
    teamId,
    resourceType: "ACCESS_GRANT",
    resourceId: grant._id,
    metadata: {
      grantId: grant._id,
      details: "Your temporary/direct access grant has been revoked.",
    },
    title: "Access Permissions Changed",
    message: "Your temporary/direct access grant has been revoked.",
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