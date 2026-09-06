import mongoose from "mongoose";
import { emitToTeam, emitToUser } from "../../realtime/event-emitter.js";
import AccessRequest from "./access-request.model.js";
import AccessGrant from "./access-grant.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import Task from "../tasks/task.model.js";
import Permission from "../permissions/permission.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { createNotification } from "../notifications/notification.service.js";
import { can, isSuperAdmin, getAllSuperAdminUserIds } from "../authorization/authorization.service.js";
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from "../../common/errors/index.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";

const POPULATE_FIELDS = [
  { path: "requesterId targetUserId reviewedBy", select: "name email" },
  { path: "permissionId", select: "name key category" },
  { path: "teamId", select: "name description" },
];

async function getTeamName(teamId) {
  try {
    const doc = await Team.findById(teamId).select("name");
    return doc?.name || "Workspace";
  } catch {
    return "Workspace";
  }
}

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
  const activeMembership = await Membership.findOne({ teamId, userId: target, status: "ACTIVE" });
  if (!activeMembership) {
    throw new BadRequestError("Target user must be an active member of this team");
  }

  let permission = null;
  if (permissionId && mongoose.Types.ObjectId.isValid(permissionId)) {
    permission = await Permission.findById(permissionId);
  }
  if (!permission && permissionKey) {
    permission = await Permission.findOne({ key: permissionKey.toLowerCase().trim() });
  }
  if (!permission) {
    throw new NotFoundError("Permission not found");
  }

  const effectiveHours = durationHours || (durationMinutes ? durationMinutes / 60 : 2);
  const expiresAt = effectiveHours ? new Date(Date.now() + effectiveHours * 3600000) : null;
  const resourceKey = resource || "*";

  if (resourceKey !== "*") {
    const rawTaskId = resourceKey.replace(/^task:/, "").trim();
    if (mongoose.Types.ObjectId.isValid(rawTaskId)) {
      const taskDoc = await Task.findById(rawTaskId);
      if (!taskDoc) throw new NotFoundError("The requested task resource does not exist.");
      if (String(taskDoc.teamId) !== String(teamId)) {
        throw new BadRequestError("The requested task resource does not belong to this team workspace.");
      }
    }
  }

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

  let approvalLevel = "TEAM_ADMIN";
  const teamAdminRoleForLevel = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" });
  if (teamAdminRoleForLevel) {
    if (Array.isArray(teamAdminRoleForLevel.permissions) && !teamAdminRoleForLevel.permissions.includes(permission.key)) {
      approvalLevel = "SUPER_ADMIN";
    }
    const reqMem = await Membership.findOne({ userId: requesterId, teamId, status: "ACTIVE" });
    if (reqMem) {
      const isReqAdmin = await MembershipRole.exists({
        membershipId: reqMem._id,
        roleId: teamAdminRoleForLevel._id,
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });
      if (isReqAdmin) approvalLevel = "SUPER_ADMIN";
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

  try {
    const [requester, teamName] = await Promise.all([
      User.findById(requesterId).select("name email"),
      getTeamName(teamId),
    ]);
    const requesterName = requester?.name || "A team member";
    const permLabel = permission.name || permission.key;
    const isTeamAdminRequester = approvalLevel === "SUPER_ADMIN";

    let recipientUserIds = [];
    if (isTeamAdminRequester) {
      recipientUserIds = await getAllSuperAdminUserIds();
    } else {
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
        recipientUserIds = adminMemberships.map((m) => String(m.userId));
      }
    }

    const uniqueRecipients = [...new Set(recipientUserIds)].filter((id) => String(id) !== String(requesterId));
    for (const rId of uniqueRecipients) {
      emitToUser(rId, "access_request:created", { accessRequest });
      createNotification({
        recipientId: rId,
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
      }).then((notifDoc) => emitToUser(rId, "notification:new", notifDoc)).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to notify reviewers of access request:", err);
  }

  logAuditEvent({
    actorId: requesterId,
    action: "access_request.created",
    targetType: "AccessRequest",
    targetId: accessRequest._id,
    teamId,
  });

  return accessRequest;
}

export async function getAllAccessRequests({ query = {} } = {}) {
  const { status, teamId, approvalLevel = "SUPER_ADMIN", page = 1, limit = 50 } = query;
  const filter = {};
  if (status && status !== "ALL") filter.status = status;
  if (teamId && teamId !== "ALL") filter.teamId = teamId;
  if (approvalLevel && approvalLevel !== "ALL") filter.approvalLevel = approvalLevel;

  const { page: pageNumber, limit: pageSize, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });
  const [requests, total] = await Promise.all([
    AccessRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize)
      .populate(POPULATE_FIELDS[0].path, POPULATE_FIELDS[0].select)
      .populate(POPULATE_FIELDS[1].path, POPULATE_FIELDS[1].select)
      .populate(POPULATE_FIELDS[2].path, POPULATE_FIELDS[2].select),
    AccessRequest.countDocuments(filter),
  ]);

  return { requests, total, page: pageNumber, limit: pageSize, totalPages: getTotalPages(total, pageSize) };
}

export async function getAccessRequestsByTeam({ teamId, query = {}, viewerId, viewerIsAdmin = false }) {
  const { status, targetUserId, page = 1, limit = 50 } = query;
  const filter = { teamId };
  if (status && status !== "ALL") filter.status = status;

  if (viewerIsAdmin) {
    if (targetUserId) filter.targetUserId = targetUserId;
    else filter.$or = [{ approvalLevel: "TEAM_ADMIN" }, { requesterId: viewerId }];
  } else {
    filter.requesterId = viewerId;
  }

  const { page: pageNumber, limit: pageSize, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });
  const [requests, total] = await Promise.all([
    AccessRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize)
      .populate(POPULATE_FIELDS[0].path, POPULATE_FIELDS[0].select)
      .populate(POPULATE_FIELDS[1].path, POPULATE_FIELDS[1].select)
      .populate(POPULATE_FIELDS[2].path, POPULATE_FIELDS[2].select),
    AccessRequest.countDocuments(filter),
  ]);

  return { requests, total, page: pageNumber, limit: pageSize, totalPages: getTotalPages(total, pageSize) };
}

export async function updateAccessRequest({ teamId, requestId, requesterId, updates = {} }) {
  const query = { _id: requestId, ...(teamId ? { teamId } : {}) };
  const request = await AccessRequest.findOne(query);
  if (!request) throw new NotFoundError("Access request not found");
  if (String(request.requesterId) !== String(requesterId)) throw new ForbiddenError("You can only edit your own access requests");
  if (request.status !== "PENDING") throw new ConflictError("Only pending access requests can be modified");

  if (updates.reason !== undefined) request.reason = updates.reason;
  if (updates.resource !== undefined) request.resource = updates.resource;
  if (updates.permissionKey) {
    const permission = await Permission.findOne({ key: updates.permissionKey.toLowerCase().trim() });
    if (!permission) throw new NotFoundError("Permission not found");
    request.permissionId = permission._id;
  }
  if (updates.durationHours !== undefined) {
    request.durationHours = updates.durationHours;
    request.expiresAt = updates.durationHours ? new Date(Date.now() + updates.durationHours * 3600000) : null;
  }

  await request.save();
  return request;
}

export async function deleteAccessRequest({ teamId, requestId, requesterId }) {
  const query = { _id: requestId, ...(teamId ? { teamId } : {}) };
  const request = await AccessRequest.findOne(query);
  if (!request) throw new NotFoundError("Access request not found");

  const effectiveTeamId = request.teamId;
  const isOwner = String(request.requesterId) === String(requesterId);
  const reviewerIsSuperAdmin = await isSuperAdmin(requesterId);
  const hasCancelPermission = reviewerIsSuperAdmin ||
    (await can(requesterId, effectiveTeamId, "access_request.cancel")) ||
    (await can(requesterId, effectiveTeamId, "access_grant.revoke"));

  if (!isOwner && !hasCancelPermission) {
    throw new ForbiddenError("You can only delete your own access requests or you need admin cancellation permissions");
  }

  const teamName = await getTeamName(effectiveTeamId);

  if (request.status === "APPROVED") {
    await AccessGrant.updateMany(
      { accessRequestId: request._id, status: "ACTIVE" },
      { $set: { status: "REVOKED", revokedAt: new Date(), revokedBy: requesterId } }
    );
    request.status = "REVOKED";
    await request.save();

    emitToUser(request.requesterId, "access_request:resolved", { requestId: request._id, teamId: effectiveTeamId, status: "REVOKED" });
    emitToUser(request.targetUserId || request.requesterId, "access:changed", { teamId: effectiveTeamId, reason: "GRANT_REVOKED" });
    emitToTeam(effectiveTeamId, "access_request:resolved", { requestId: request._id, status: "REVOKED" });

    if (String(request.requesterId) !== String(requesterId)) {
      createNotification({
        recipientId: request.requesterId,
        actorId: requesterId,
        type: "ACCESS_REVOKED",
        teamId: effectiveTeamId,
        resourceType: "ACCESS_REQUEST",
        resourceId: request._id,
        metadata: { requestId: request._id, teamName, details: "Your active JIT access grant has been revoked by an administrator." },
        title: "JIT Access Revoked",
        message: `Your active JIT access grant in ${teamName} has been revoked by an administrator.`,
      }).then((notifDoc) => emitToUser(request.requesterId, "notification:new", notifDoc)).catch(() => {});
    }

    return { success: true, message: "Active JIT grant revoked successfully" };
  }

  await AccessRequest.findOneAndDelete({ _id: requestId });
  emitToUser(request.requesterId, "access_request:deleted", { requestId, teamId: effectiveTeamId });
  emitToTeam(effectiveTeamId, "access_request:deleted", { requestId, teamId: effectiveTeamId });

  if (String(request.requesterId) !== String(requesterId)) {
    createNotification({
      recipientId: request.requesterId,
      actorId: requesterId,
      type: "ACCESS_CANCELLED",
      teamId: effectiveTeamId,
      resourceType: "ACCESS_REQUEST",
      resourceId: request._id,
      metadata: { requestId: request._id, status: "CANCELLED" },
      title: "JIT Access Request Cancelled",
      message: "Your pending JIT access request was cancelled by an administrator.",
    }).then((notifDoc) => emitToUser(request.requesterId, "notification:new", notifDoc)).catch(() => {});
  }

  return { success: true, message: "Access request deleted successfully" };
}

export async function approveAccessRequest({ teamId, requestId, reviewerId, durationHours }) {
  const query = { _id: requestId, ...(teamId ? { teamId } : {}) };
  const request = await AccessRequest.findOne(query);
  if (!request) throw new NotFoundError("Access request not found");
  if (request.status !== "PENDING") throw new ConflictError("Only pending access requests can be approved");
  if (String(request.requesterId) === String(reviewerId)) {
    throw new ForbiddenError("Self-approval is forbidden. You cannot approve your own JIT access request.", "SELF_APPROVAL_FORBIDDEN");
  }

  const effectiveTeamId = request.teamId;
  const targetUserId = request.targetUserId || request.requesterId;
  const resourceKey = request.resource || "*";
  const reviewerIsSuperAdmin = await isSuperAdmin(reviewerId);

  if (request.approvalLevel === "SUPER_ADMIN" && !reviewerIsSuperAdmin) {
    throw new ForbiddenError("This JIT access request requires Super Admin approval.", "SUPER_ADMIN_APPROVAL_REQUIRED");
  }

  const reqMem = await Membership.findOne({ userId: request.requesterId, teamId: effectiveTeamId, status: "ACTIVE" });
  if (reqMem) {
    const teamAdminRole = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" }).select("_id");
    if (teamAdminRole) {
      const reqIsAdmin = await MembershipRole.exists({
        membershipId: reqMem._id,
        roleId: teamAdminRole._id,
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });
      if (reqIsAdmin && !reviewerIsSuperAdmin) {
        throw new ForbiddenError("JIT access requests from Team Admins can only be approved by a Super Admin.", "SUPER_ADMIN_APPROVAL_REQUIRED");
      }
    }
  }

  let permissionId = request.permissionId;
  let permissionDoc = (permissionId && mongoose.Types.ObjectId.isValid(permissionId)) ? await Permission.findById(permissionId).select("name key") : null;
  if (!permissionDoc) {
    permissionDoc = await Permission.findOne({});
    permissionId = permissionDoc?._id;
  }
  const permKey = permissionDoc?.key || "task.read";

  if (!reviewerIsSuperAdmin) {
    const reviewerHasPerm = await can(reviewerId, effectiveTeamId, permKey);
    if (!reviewerHasPerm) {
      throw new ForbiddenError("Privilege escalation prevented: You cannot approve a JIT grant for a permission exceeding your own effective permissions.", "PRIVILEGE_CLAWBACK_PREVENTED");
    }
  }

  const effectiveHours = typeof durationHours === "number" ? durationHours : (typeof request.durationHours === "number" ? request.durationHours : 2);
  const finalExpiresAt = new Date(Date.now() + effectiveHours * 3600000);

  const session = await mongoose.startSession();
  let grant = null;
  let updatedRequest = null;

  try {
    await session.withTransaction(async () => {
      const targetMembership = await Membership.findOne({ userId: targetUserId, teamId: effectiveTeamId, status: "ACTIVE" }).session(session);
      if (!targetMembership) {
        throw new ForbiddenError("Target user must be an active member of this workspace to receive JIT access.", "TARGET_NOT_ACTIVE_MEMBER");
      }

      updatedRequest = await AccessRequest.findOneAndUpdate(
        { _id: requestId, status: "PENDING", ...(teamId ? { teamId } : {}) },
        { $set: { status: "APPROVED", reviewedBy: reviewerId, reviewedAt: new Date(), expiresAt: finalExpiresAt } },
        { returnDocument: "after", session }
      );

      if (!updatedRequest) throw new ConflictError("Access request is no longer pending or was already resolved.");

      grant = await AccessGrant.findOneAndUpdate(
        { userId: targetUserId, teamId: effectiveTeamId, permissionId, resource: resourceKey },
        {
          $set: {
            status: "ACTIVE",
            permissionKey: permKey.toLowerCase().trim(),
            grantedBy: reviewerId,
            source: "ACCESS_REQUEST",
            accessRequestId: updatedRequest._id,
            expiresAt: finalExpiresAt,
            revokedAt: null,
            revokedBy: null,
          },
        },
        { upsert: true, returnDocument: "after", session }
      );
    });
  } finally {
    await session.endSession();
  }

  const permLabel = permissionDoc?.name || permissionDoc?.key || "resource";
  const teamName = await getTeamName(effectiveTeamId);

  try {
    emitToUser(request.requesterId, "access_request:resolved", { requestId: updatedRequest._id, teamId: effectiveTeamId, status: "APPROVED", expiresAt: finalExpiresAt });
    emitToUser(targetUserId, "access:changed", { teamId: effectiveTeamId, reason: "GRANT_APPROVED" });
    emitToTeam(effectiveTeamId, "access_request:resolved", { requestId: updatedRequest._id, status: "APPROVED" });

    createNotification({
      recipientId: request.requesterId,
      actorId: reviewerId,
      type: "ACCESS_GRANTED",
      teamId: effectiveTeamId,
      resourceType: "ACCESS_REQUEST",
      resourceId: updatedRequest._id,
      metadata: { permissionName: permLabel, grantId: grant._id, requestId: updatedRequest._id, teamName, expiresAt: finalExpiresAt, details: `Your access request for '${permLabel}' in ${teamName} has been approved.` },
      title: "JIT Access Approved",
      message: `Your access request for '${permLabel}' in ${teamName} has been approved. Lease active until ${finalExpiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    }).then((notifDoc) => emitToUser(request.requesterId, "notification:new", notifDoc)).catch(() => {});
  } catch (err) {
    console.error("Error dispatching access request approval events:", err);
  }

  logAuditEvent({
    actorId: reviewerId,
    action: "access_request.approved",
    targetType: "AccessRequest",
    targetId: updatedRequest._id,
    teamId: effectiveTeamId,
    metadata: { grantId: grant._id, expiresAt: finalExpiresAt },
  });

  return { request: updatedRequest, grant };
}

export async function rejectAccessRequest({ teamId, requestId, reviewerId, reason }) {
  const query = { _id: requestId, ...(teamId ? { teamId } : {}) };
  const request = await AccessRequest.findOne(query);
  if (!request) throw new NotFoundError("Access request not found");
  if (String(request.requesterId) === String(reviewerId)) throw new ForbiddenError("Self-rejection is not allowed; use cancel/delete instead");
  if (request.status !== "PENDING") throw new ConflictError("Only pending access requests can be rejected");

  const effectiveTeamId = request.teamId;
  const updatedRequest = await AccessRequest.findOneAndUpdate(
    { _id: requestId, status: "PENDING", ...(teamId ? { teamId } : {}) },
    { $set: { status: "REJECTED", reviewedBy: reviewerId, reviewedAt: new Date(), ...(reason ? { rejectionReason: reason } : {}) } },
    { returnDocument: "after" }
  );

  if (!updatedRequest) throw new ConflictError("Access request is no longer pending or was already resolved.");

  let rejectedPermLabel = "resource";
  if (request.permissionId && mongoose.Types.ObjectId.isValid(request.permissionId)) {
    const rejectedPerm = await Permission.findById(request.permissionId).select("name key");
    if (rejectedPerm) rejectedPermLabel = rejectedPerm.name || rejectedPerm.key || "resource";
  }

  const teamName = await getTeamName(effectiveTeamId);

  emitToUser(request.requesterId, "access_request:resolved", { requestId: request._id, teamId: effectiveTeamId, status: "REJECTED" });
  emitToTeam(effectiveTeamId, "access_request:resolved", { requestId: request._id, status: "REJECTED" });

  createNotification({
    recipientId: request.requesterId,
    actorId: reviewerId,
    type: "ACCESS_REJECTED",
    teamId: effectiveTeamId,
    resourceType: "ACCESS_REQUEST",
    resourceId: request._id,
    metadata: { requestId: request._id, permissionName: rejectedPermLabel, teamName, reason, status: "REJECTED" },
    title: "JIT Access Request Rejected",
    message: `Your access request for '${rejectedPermLabel}' in ${teamName} was rejected.${reason ? ` Reason: ${reason}` : ""}`,
  }).then((notifDoc) => emitToUser(request.requesterId, "notification:new", notifDoc)).catch(() => {});

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
  const query = { _id: requestId, ...(teamId ? { teamId } : {}) };
  const request = await AccessRequest.findOne(query);
  if (!request) throw new NotFoundError("Access request not found");
  if (request.status !== "APPROVED") throw new ConflictError("Only approved (active) access requests can have their grant revoked");

  const effectiveTeamId = request.teamId;
  const grant = await AccessGrant.findOne({ accessRequestId: request._id, status: "ACTIVE" })
    || await AccessGrant.findOne({ userId: request.targetUserId || request.requesterId, teamId: effectiveTeamId, permissionId: request.permissionId, status: "ACTIVE" });

  if (!grant) throw new NotFoundError("No active access grant found for this request");

  grant.status = "REVOKED";
  grant.revokedBy = revokedBy;
  grant.revokedAt = new Date();
  await grant.save();

  request.status = "REVOKED";
  await request.save();

  const teamName = await getTeamName(effectiveTeamId);

  emitToUser(grant.userId, "access_grant:revoked", { grantId: grant._id, teamId: effectiveTeamId });
  emitToUser(grant.userId, "access:changed", { teamId: effectiveTeamId, reason: "GRANT_REVOKED" });
  emitToUser(request.requesterId, "access_request:resolved", { requestId: request._id, teamId: effectiveTeamId, status: "REVOKED" });
  emitToTeam(effectiveTeamId, "access_request:resolved", { requestId: request._id, status: "REVOKED" });
  emitToTeam(effectiveTeamId, "access_grant:revoked", { grantId: grant._id, requestId: request._id, userId: grant.userId });

  createNotification({
    recipientId: request.requesterId,
    actorId: revokedBy,
    type: "ACCESS_REVOKED",
    teamId: effectiveTeamId,
    resourceType: "ACCESS_REQUEST",
    resourceId: request._id,
    metadata: { requestId: request._id, grantId: grant._id, teamName, details: "Your temporary JIT access grant has been revoked early by an administrator." },
    title: "JIT Access Revoked",
    message: `Your temporary JIT access grant in ${teamName} has been revoked early by an administrator.`,
  }).then((notifDoc) => emitToUser(request.requesterId, "notification:new", notifDoc)).catch(() => {});

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
  const query = { _id: grantId, status: "ACTIVE", ...(teamId ? { teamId } : {}) };
  const grant = await AccessGrant.findOne(query);
  if (!grant) throw new NotFoundError("Active access grant not found");

  const effectiveTeamId = grant.teamId;
  grant.status = "REVOKED";
  grant.revokedBy = revokedBy;
  grant.revokedAt = new Date();
  await grant.save();

  const teamName = await getTeamName(effectiveTeamId);

  emitToUser(grant.userId, "access_grant:revoked", { grantId: grant._id, teamId: effectiveTeamId, permissionId: grant.permissionId });
  emitToUser(grant.userId, "access:changed", { teamId: effectiveTeamId, reason: "GRANT_REVOKED" });
  emitToTeam(effectiveTeamId, "access_grant:revoked", { grantId: grant._id, userId: grant.userId });

  createNotification({
    recipientId: grant.userId,
    actorId: revokedBy,
    type: "ACCESS_REVOKED",
    teamId: effectiveTeamId,
    resourceType: "ACCESS_GRANT",
    resourceId: grant._id,
    metadata: { grantId: grant._id, teamName, details: "Your temporary/direct access grant has been revoked." },
    title: "JIT Access Revoked",
    message: `Your temporary access grant in ${teamName} has been revoked.`,
  }).then((notifDoc) => emitToUser(grant.userId, "notification:new", notifDoc)).catch(() => {});

  logAuditEvent({
    actorId: revokedBy,
    action: "access_grant.revoked",
    targetType: "AccessGrant",
    targetId: grant._id,
    teamId: effectiveTeamId,
  });

  return { success: true, message: "Access grant revoked successfully" };
}

export async function getAccessRequestById({ teamId, requestId }) {
  const query = { _id: requestId, ...(teamId ? { teamId } : {}) };
  const request = await AccessRequest.findOne(query)
    .populate(POPULATE_FIELDS[0].path, POPULATE_FIELDS[0].select)
    .populate(POPULATE_FIELDS[1].path, POPULATE_FIELDS[1].select)
    .populate(POPULATE_FIELDS[2].path, POPULATE_FIELDS[2].select);
  if (!request) throw new NotFoundError("Access request not found");
  return request;
}

export async function getActiveTemporaryGrant({ teamId, userId }) {
  const query = { userId, status: "ACTIVE", expiresAt: { $gt: new Date() }, ...(teamId ? { teamId } : {}) };
  return AccessGrant.findOne(query);
}
