import mongoose from "mongoose";
import Notification from "./notification.model.js";
import Broadcast from "./broadcast.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import Team from "../teams/team.model.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";
import { emitToUser, emitToTeam, emitToAll } from "../../realtime/event-emitter.js";
import { NotificationTemplates } from "./notification.templates.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { ForbiddenError, NotFoundError } from "../../common/errors/index.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

function resolveTitleMessage(type, title, message, metadata = {}) {
  let finalTitle = title;
  let finalMessage = message;
  if ((!finalTitle || !finalMessage) && NotificationTemplates[type]) {
    const t = NotificationTemplates[type](metadata);
    if (!finalTitle) finalTitle = t.title;
    if (!finalMessage) finalMessage = t.message;
  }
  return {
    title: finalTitle || "System Notification",
    message: finalMessage || "You have a new update.",
  };
}

function toNotifPayload(doc) {
  return {
    _id: doc._id,
    id: doc._id,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    teamId: doc.teamId,
    resourceType: doc.resourceType,
    resourceId: doc.resourceId,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    readAt: doc.readAt,
  };
}

export async function getUnreadNotificationCount({ userId }) {
  if (!isValidId(userId)) return { unreadCount: 0 };
  const unreadCount = await Notification.countDocuments({ recipientId: userId, readAt: null });
  return { unreadCount };
}

export async function createDomainNotification({
  recipientId,
  actorId = null,
  type,
  title,
  message,
  teamId = null,
  resourceType = "SYSTEM",
  resourceId = null,
  metadata = {},
  expiresAt = null,
  allowSelfNotification = false,
}) {
  if (!isValidId(recipientId)) return null;
  if (!allowSelfNotification && actorId && String(actorId) === String(recipientId)) return null;

  const resolved = resolveTitleMessage(type, title, message, metadata);
  const notification = await Notification.create({
    recipientId,
    actorId: isValidId(actorId) ? actorId : null,
    type,
    title: resolved.title,
    message: resolved.message,
    teamId: isValidId(teamId) ? teamId : null,
    resourceType: resourceType || "SYSTEM",
    resourceId: resourceId ? String(resourceId) : null,
    resource: resourceId ? `${resourceType?.toLowerCase()}:${resourceId}` : null,
    metadata,
    expiresAt,
  });

  try {
    emitToUser(recipientId, "notification:new", toNotifPayload(notification));
    const { unreadCount } = await getUnreadNotificationCount({ userId: recipientId });
    emitToUser(recipientId, "notification:count", { unreadCount });
  } catch (err) {
    console.error("Failed to emit notification socket event:", err);
  }

  return notification;
}

export const createNotification = createDomainNotification;

export async function createTargetedNotifications({
  actorId = null,
  recipients = [],
  type,
  title,
  message,
  teamId = null,
  resourceType = "SYSTEM",
  resourceId = null,
  metadata = {},
}) {
  const rawList = Array.isArray(recipients) ? recipients : [recipients];
  const uniqueRecipients = [...new Set(rawList.filter(Boolean).map((r) => String(r._id || r.id || r)))].filter(isValidId);
  if (uniqueRecipients.length === 0) return [];

  const created = [];
  for (const recipientId of uniqueRecipients) {
    const notif = await createDomainNotification({
      recipientId,
      actorId,
      type,
      title,
      message,
      teamId,
      resourceType,
      resourceId,
      metadata,
      allowSelfNotification: true,
    });
    if (notif) created.push(notif);
  }
  return created;
}

export async function createBatchDomainNotifications(notifications = []) {
  if (!Array.isArray(notifications) || notifications.length === 0) return [];

  const validDocs = notifications.reduce((acc, item) => {
    const { recipientId, actorId = null, type, title, message, teamId = null, resourceType = "SYSTEM", resourceId = null, metadata = {}, expiresAt = null, allowSelfNotification = false } = item;
    if (!isValidId(recipientId) || (!allowSelfNotification && actorId && String(actorId) === String(recipientId))) return acc;
    const resolved = resolveTitleMessage(type, title, message, metadata);
    acc.push({
      recipientId,
      actorId: isValidId(actorId) ? actorId : null,
      type,
      title: resolved.title,
      message: resolved.message,
      teamId: isValidId(teamId) ? teamId : null,
      resourceType: resourceType || "SYSTEM",
      resourceId: resourceId ? String(resourceId) : null,
      resource: resourceId ? `${resourceType?.toLowerCase()}:${resourceId}` : null,
      metadata,
      expiresAt,
    });
    return acc;
  }, []);

  if (validDocs.length === 0) return [];
  const createdDocs = await Notification.insertMany(validDocs);

  for (const doc of createdDocs) {
    try {
      emitToUser(doc.recipientId, "notification:new", toNotifPayload(doc));
      getUnreadNotificationCount({ userId: doc.recipientId }).then(({ unreadCount }) => {
        emitToUser(doc.recipientId, "notification:count", { unreadCount });
      }).catch(() => {});
    } catch {}
  }

  return createdDocs;
}

export async function getUserNotifications({ userId, unreadOnly = false, page = 1, limit = 20 }) {
  if (!isValidId(userId)) return { notifications: [], total: 0, page: 1, totalPages: 0, unreadCount: 0 };
  const filter = { recipientId: userId, ...(unreadOnly ? { readAt: null } : {}) };
  const { page: sanitizedPage, limit: sanitizedLimit, skip } = getPaginationParams({ page, limit, defaultLimit: 20 });

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sanitizedLimit)
      .populate("teamId", "name slug")
      .populate("actorId", "name email"),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: userId, readAt: null }),
  ]);

  return { notifications, total, page: sanitizedPage, totalPages: getTotalPages(total, sanitizedLimit), unreadCount };
}

export async function markNotificationAsRead({ notificationId, userId }) {
  if (!isValidId(notificationId) || !isValidId(userId)) return null;
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  const { unreadCount } = await getUnreadNotificationCount({ userId });
  emitToUser(userId, "notification:count", { unreadCount });
  return updated;
}

export async function markAllNotificationsAsRead(userId) {
  if (!isValidId(userId)) return { updatedCount: 0, unreadCount: 0 };
  const result = await Notification.updateMany({ recipientId: userId, readAt: null }, { $set: { readAt: new Date() } });
  emitToUser(userId, "notification:count", { unreadCount: 0 });
  return { updatedCount: result.modifiedCount, unreadCount: 0 };
}

export async function deleteNotification({ notificationId, userId }) {
  if (!isValidId(notificationId) || !isValidId(userId)) return null;
  const deleted = await Notification.findOneAndDelete({ _id: notificationId, recipientId: userId });
  const { unreadCount } = await getUnreadNotificationCount({ userId });
  emitToUser(userId, "notification:count", { unreadCount });
  return deleted;
}

export async function broadcastToTeam({
  teamId,
  senderId,
  title,
  body,
  type = "ANNOUNCEMENT",
  isSticky = false,
  requiresAck = false,
  startsAt = null,
  expiresAt = null,
}) {
  if (!teamId || !senderId) throw new NotFoundError("Team ID and Sender ID are required.");

  const [user, membership] = await Promise.all([
    User.findById(senderId),
    Membership.findOne({ userId: senderId, teamId, status: "ACTIVE" }),
  ]);
  if (!user || !membership) throw new ForbiddenError("You must be an active member of this team to send broadcasts.");

  const memberRoles = await MembershipRole.find({ membershipId: membership._id, revokedAt: null }).populate("roleId", "name");
  const roleNames = memberRoles.map((mr) => mr.roleId?.name).filter(Boolean);
  const isTeamAdmin = Boolean(user.isSuperAdmin || roleNames.includes("Super Admin") || roleNames.includes("Team Admin"));
  if (!isTeamAdmin) throw new ForbiddenError("Only Team Admins or Super Admins can send team broadcasts.");

  const finalStartsAt = startsAt ? new Date(startsAt) : new Date();
  const finalExpiresAt = expiresAt ? new Date(expiresAt) : null;
  const broadcast = await Broadcast.create({
    teamId,
    senderId,
    title,
    body,
    type,
    severity: type === "OUTAGE" ? "CRITICAL" : type === "MAINTENANCE" ? "WARNING" : "INFO",
    isSticky,
    requiresAck,
    startsAt: finalStartsAt,
    expiresAt: finalExpiresAt,
    status: "ACTIVE",
  });

  const bulletinPayload = {
    id: broadcast._id.toString(),
    _id: broadcast._id.toString(),
    broadcastId: broadcast._id.toString(),
    title: broadcast.title,
    body: broadcast.body,
    type: broadcast.type,
    severity: broadcast.severity,
    isSticky: broadcast.isSticky,
    requiresAck: broadcast.requiresAck,
    startsAt: broadcast.startsAt,
    expiresAt: broadcast.expiresAt,
    createdAt: broadcast.createdAt,
    sentAt: broadcast.createdAt,
    sentBy: `${user?.name || "Admin"} (${membership?.roleId?.name || "Team Admin"})`,
  };
  try {
    emitToTeam(teamId, "broadcast:new", bulletinPayload);
    emitToTeam(teamId, "bulletin:new", bulletinPayload);
  } catch (err) {
    console.error("Failed to emit broadcast socket event:", err);
  }

  logAuditEvent({
    actorId: senderId,
    action: "team.broadcast_created",
    targetType: "Broadcast",
    targetId: broadcast._id,
    teamId,
    metadata: { title, type, startsAt: finalStartsAt, expiresAt: finalExpiresAt },
  });

  return broadcast;
}

function matchBroadcastScope(b, teamId, teamName) {
  if (b.teamId) return teamId && String(b.teamId) === String(teamId);
  if (!b.scope || b.scope === "GLOBAL" || (b.targetWorkspaces || []).some((t) => typeof t === "string" && t.includes("All Workspaces"))) return true;
  if (b.scope === "WORKSPACE_SCOPED") {
    if (!teamId) return false;
    const targets = (b.targetWorkspaces || []).filter((t) => typeof t === "string" && !t.includes("All Workspaces"));
    return targets.length > 0 && targets.some((t) => t === String(teamId) || (teamName && t.trim().toLowerCase() === teamName.trim().toLowerCase()));
  }
  return true;
}

export async function getTeamBroadcasts({ teamId }) {
  if (!teamId) return [];
  let teamName = null;
  if (isValidId(teamId)) {
    const teamDoc = await Team.findById(teamId).select("name");
    if (teamDoc) teamName = teamDoc.name;
  }
  const rawBroadcasts = await Broadcast.find({
    $or: [{ teamId: new mongoose.Types.ObjectId(teamId) }, { teamId: null }, { scope: "GLOBAL" }, { scope: "WORKSPACE_SCOPED" }],
  }).sort({ createdAt: -1 }).populate("senderId", "name email");

  return rawBroadcasts.filter((b) => matchBroadcastScope(b, teamId, teamName));
}

function formatBroadcastRecord(b) {
  const senderName = b.senderId?.name || b.senderId?.email || "Super Admin";
  return {
    _id: b._id.toString(),
    id: b._id.toString(),
    broadcastId: b._id.toString(),
    title: b.title,
    body: b.body,
    message: b.body,
    type: b.type || "ANNOUNCEMENT",
    severity: b.severity || (b.type === "OUTAGE" ? "CRITICAL" : "INFO"),
    scope: b.scope || "GLOBAL",
    targetWorkspaces: b.targetWorkspaces || [],
    targetRoles: b.targetRoles || [],
    ackMode: b.ackMode || "READ_RECEIPT",
    status: b.status || "ACTIVE",
    cta: b.cta || null,
    metrics: b.metrics || { targetedUsers: 0, viewedCount: 0, acknowledgedCount: 0 },
    workspaceBreakdown: b.workspaceBreakdown || [],
    roleBreakdown: b.roleBreakdown || [],
    isSticky: Boolean(b.isSticky),
    requiresAck: Boolean(b.requiresAck || b.ackMode === "MANDATORY_ACK"),
    startsAt: b.startsAt,
    expiresAt: b.expiresAt,
    createdAt: b.createdAt,
    createdBy: senderName,
    timeLabel: b.status === "SCHEDULED" ? `Scheduled for ${new Date(b.startsAt).toLocaleString()}` : b.status === "ENDED" ? "Ended" : "Live • Published",
    stickyNotice: b.ackMode === "MANDATORY_ACK" ? "Requires mandatory electronic acknowledgment" : "Active banner",
  };
}

export async function getActiveSystemBulletins({ teamId = null } = {}) {
  const now = new Date();
  const query = { status: "ACTIVE", startsAt: { $lte: now }, $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }] };
  if (isValidId(teamId)) query.$and.push({ $or: [{ teamId: null }, { teamId: new mongoose.Types.ObjectId(teamId) }] });

  const rawBulletins = await Broadcast.find(query).sort({ isSticky: -1, startsAt: -1 }).populate("senderId", "name email");
  let teamName = null;
  if (isValidId(teamId)) {
    const teamDoc = await Team.findById(teamId).select("name");
    if (teamDoc) teamName = teamDoc.name;
  }
  return rawBulletins.filter((b) => matchBroadcastScope(b, teamId, teamName)).map(formatBroadcastRecord);
}

export async function getAllBroadcasts({ status, type, search } = {}) {
  const query = {};
  if (status && status !== "ALL") query.status = status;
  if (type && type !== "ALL") query.type = type;
  if (search?.trim()) {
    query.$or = [{ title: { $regex: search.trim(), $options: "i" } }, { body: { $regex: search.trim(), $options: "i" } }];
  }
  const broadcasts = await Broadcast.find(query).sort({ createdAt: -1 }).populate("senderId", "name email");
  return broadcasts.map(formatBroadcastRecord);
}

async function dispatchBroadcastSockets(formatted, eventName, senderId) {
  try {
    const effWorkspaces = (formatted.targetWorkspaces || []).filter((w) => typeof w === "string" && !w.includes("All Workspaces"));
    if (formatted.scope === "WORKSPACE_SCOPED" && effWorkspaces.length > 0) {
      const validIds = effWorkspaces.filter(isValidId);
      const targetedTeams = await Team.find({ $or: [{ _id: { $in: validIds } }, { name: { $in: effWorkspaces } }] }).select("_id");
      for (const t of targetedTeams) {
        emitToTeam(t._id, eventName, formatted);
        emitToTeam(t._id, eventName.replace("broadcast", "bulletin"), formatted);
      }
      if (senderId) emitToUser(senderId, eventName, formatted);
    } else {
      emitToAll(eventName, formatted);
      emitToAll(eventName.replace("broadcast", "bulletin"), formatted);
    }
  } catch (err) {
    console.error(`Failed to emit ${eventName} socket event:`, err);
  }
}

export async function createGlobalBroadcast({ senderId, data }) {
  const user = await User.findById(senderId);
  if (!user) throw new NotFoundError("Sender user not found.");

  const {
    title, message, body, type = "ANNOUNCEMENT", severity, scope = "GLOBAL",
    targetWorkspaces = [], targetRoles = [], ackMode = "READ_RECEIPT",
    cta, metrics, workspaceBreakdown, roleBreakdown, isSticky = false, requiresAck = false,
    startTiming = "NOW", scheduledDate, endTiming = "DISMISSED", expireDate, startsAt, expiresAt,
  } = data;

  if (!title || (!body && !message)) throw new Error("Title and message/body are required for broadcast.");
  const finalBody = (body || message).trim();
  const finalTitle = title.trim();
  const finalStartsAt = startTiming === "SCHEDULED" && scheduledDate ? new Date(scheduledDate) : startsAt ? new Date(startsAt) : new Date();
  const finalExpiresAt = endTiming === "DATE" && expireDate ? new Date(expireDate) : expiresAt ? new Date(expiresAt) : null;
  const initialStatus = finalStartsAt > new Date() ? "SCHEDULED" : "ACTIVE";

  let targetedCount = metrics?.targetedUsers;
  if (!targetedCount) {
    targetedCount = scope === "GLOBAL"
      ? await User.countDocuments({ status: { $ne: "INACTIVE" } })
      : Math.max(1, ((scope === "ROLE_SCOPED" ? targetRoles : targetWorkspaces)?.length || 1) * 35);
  }

  const sanitizedWorkspaces = scope === "GLOBAL" ? ["All Workspaces (Global Fleet)"] : (targetWorkspaces || []).filter((w) => typeof w === "string" && !w.includes("All Workspaces"));
  const sanitizedRoles = scope === "ROLE_SCOPED" ? (targetRoles || []).filter((r) => typeof r === "string" && !r.includes("All Roles")) : scope === "GLOBAL" ? ["All Roles"] : targetRoles || [];

  const broadcastDoc = await Broadcast.create({
    teamId: null,
    senderId,
    title: finalTitle,
    body: finalBody,
    type,
    severity: severity || (type === "OUTAGE" ? "CRITICAL" : type === "MAINTENANCE" ? "WARNING" : "INFO"),
    scope,
    targetWorkspaces: sanitizedWorkspaces.length > 0 ? sanitizedWorkspaces : ["All Workspaces (Global Fleet)"],
    targetRoles: sanitizedRoles.length > 0 ? sanitizedRoles : ["All Roles"],
    ackMode,
    cta: cta?.label ? { label: cta.label, url: cta.url } : null,
    metrics: { targetedUsers: targetedCount || 1, viewedCount: metrics?.viewedCount || 0, acknowledgedCount: metrics?.acknowledgedCount || 0 },
    workspaceBreakdown: workspaceBreakdown || [],
    roleBreakdown: roleBreakdown || [],
    isSticky: Boolean(isSticky),
    requiresAck: Boolean(requiresAck || ackMode === "MANDATORY_ACK"),
    startsAt: finalStartsAt,
    expiresAt: finalExpiresAt,
    status: initialStatus,
  });

  const formatted = formatBroadcastRecord(await broadcastDoc.populate("senderId", "name email"));
  await dispatchBroadcastSockets(formatted, "broadcast:new", senderId);

  try {
    let recipientIds = [];
    if (scope === "WORKSPACE_SCOPED" && sanitizedWorkspaces.length > 0) {
      const validIds = sanitizedWorkspaces.filter(isValidId);
      const matchedTeams = await Team.find({ $or: [{ _id: { $in: validIds } }, { name: { $in: sanitizedWorkspaces } }] }).select("_id");
      if (matchedTeams.length > 0) {
        const activeMembers = await Membership.find({ teamId: { $in: matchedTeams.map((t) => t._id) }, status: "ACTIVE" }).select("userId");
        recipientIds = [...new Set(activeMembers.map((m) => String(m.userId)))];
      }
    } else if (scope === "GLOBAL") {
      const activeUsers = await User.find({ status: { $ne: "INACTIVE" } }).select("_id");
      recipientIds = activeUsers.map((u) => String(u._id));
    }

    for (const recipientId of recipientIds) {
      if (String(recipientId) !== String(senderId)) {
        await createDomainNotification({
          recipientId,
          actorId: senderId,
          type: type === "OUTAGE" ? "SECURITY_ALERT" : "SYSTEM",
          title: `[${type}] ${finalTitle}`,
          message: finalBody.slice(0, 160),
          resourceType: "SYSTEM",
          resourceId: broadcastDoc._id.toString(),
          metadata: { broadcastId: broadcastDoc._id.toString(), severity: formatted.severity },
          allowSelfNotification: false,
        });
      }
    }
  } catch (err) {
    console.error("Failed to dispatch in-app notifications for broadcast:", err);
  }

  logAuditEvent({
    actorId: senderId,
    action: "system.broadcast_published",
    targetType: "Broadcast",
    targetId: broadcastDoc._id,
    metadata: { title: finalTitle, type, scope, status: initialStatus, targetedUsers: targetedCount },
  });

  return formatted;
}

export async function updateBroadcast({ broadcastId, updates, senderId }) {
  if (!isValidId(broadcastId)) throw new NotFoundError("Invalid broadcast ID.");
  const broadcast = await Broadcast.findById(broadcastId);
  if (!broadcast) throw new NotFoundError("Broadcast not found.");

  if (updates.title !== undefined) broadcast.title = updates.title.trim();
  if (updates.body !== undefined || updates.message !== undefined) broadcast.body = (updates.body || updates.message).trim();
  if (updates.type !== undefined) broadcast.type = updates.type;
  if (updates.severity !== undefined) broadcast.severity = updates.severity;
  if (updates.scope !== undefined) broadcast.scope = updates.scope;
  const effScope = updates.scope || broadcast.scope;
  if (updates.targetWorkspaces !== undefined) {
    broadcast.targetWorkspaces = effScope === "GLOBAL" ? ["All Workspaces (Global Fleet)"] : (updates.targetWorkspaces || []).filter((w) => typeof w === "string" && !w.includes("All Workspaces"));
  }
  if (updates.targetRoles !== undefined) {
    broadcast.targetRoles = effScope === "ROLE_SCOPED" ? (updates.targetRoles || []).filter((r) => typeof r === "string" && !r.includes("All Roles")) : effScope === "GLOBAL" ? ["All Roles"] : updates.targetRoles || [];
  }
  if (updates.ackMode !== undefined) broadcast.ackMode = updates.ackMode;
  if (updates.status !== undefined) broadcast.status = updates.status;
  if (updates.cta !== undefined) broadcast.cta = updates.cta;
  if (updates.isSticky !== undefined) broadcast.isSticky = Boolean(updates.isSticky);
  if (updates.requiresAck !== undefined) broadcast.requiresAck = Boolean(updates.requiresAck);
  if (updates.startsAt !== undefined) broadcast.startsAt = new Date(updates.startsAt);
  if (updates.expiresAt !== undefined) broadcast.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;

  await broadcast.save();
  const formatted = formatBroadcastRecord(await broadcast.populate("senderId", "name email"));
  await dispatchBroadcastSockets(formatted, "broadcast:updated", senderId);

  logAuditEvent({
    actorId: senderId,
    action: "system.broadcast_updated",
    targetType: "Broadcast",
    targetId: broadcast._id,
    metadata: { updates },
  });

  return formatted;
}

export async function deleteBroadcast({ broadcastId, senderId }) {
  if (!isValidId(broadcastId)) throw new NotFoundError("Invalid broadcast ID.");
  const broadcast = await Broadcast.findByIdAndDelete(broadcastId);
  if (!broadcast) throw new NotFoundError("Broadcast not found.");

  try {
    emitToAll("broadcast:deleted", { id: broadcastId, _id: broadcastId });
    emitToAll("bulletin:deleted", { id: broadcastId, _id: broadcastId });
  } catch (err) {
    console.error("Failed to emit broadcast:deleted socket event:", err);
  }

  logAuditEvent({
    actorId: senderId,
    action: "system.broadcast_deleted",
    targetType: "Broadcast",
    targetId: broadcastId,
    metadata: { title: broadcast.title },
  });

  return { deleted: true, id: broadcastId };
}
