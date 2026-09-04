import mongoose from "mongoose";
import Notification from "./notification.model.js";
import Broadcast from "./broadcast.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";
import { emitToUser, emitToTeam } from "../../realtime/event-emitter.js";
import { NotificationTemplates } from "./notification.templates.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { ForbiddenError, NotFoundError } from "../../common/errors/index.js";

/**
 * 1. Get total unread notifications count for a user
 */
export async function getUnreadNotificationCount({ userId }) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return { unreadCount: 0 };
  }

  const unreadCount = await Notification.countDocuments({
    recipientId: userId,
    readAt: null,
  });

  return { unreadCount };
}

/**
 * 2. Create and persist a domain notification (with actor exclusion & real-time dispatch)
 */
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
  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return null;
  }

  // 1. Guard against self-notification unless explicitly permitted
  if (!allowSelfNotification && actorId && String(actorId) === String(recipientId)) {
    return null;
  }

  // 2. Format title & message from templates if not supplied
  let finalTitle = title;
  let finalMessage = message;
  if ((!finalTitle || !finalMessage) && NotificationTemplates[type]) {
    const template = NotificationTemplates[type](metadata);
    if (!finalTitle) finalTitle = template.title;
    if (!finalMessage) finalMessage = template.message;
  }

  if (!finalTitle || !finalMessage) {
    finalTitle = finalTitle || "System Notification";
    finalMessage = finalMessage || "You have a new update.";
  }

  // 3. Persist notification in database
  const notification = await Notification.create({
    recipientId,
    actorId: actorId && mongoose.Types.ObjectId.isValid(actorId) ? actorId : null,
    type,
    title: finalTitle,
    message: finalMessage,
    teamId: teamId && mongoose.Types.ObjectId.isValid(teamId) ? teamId : null,
    resourceType: resourceType || "SYSTEM",
    resourceId: resourceId ? String(resourceId) : null,
    resource: resourceId ? `${resourceType?.toLowerCase()}:${resourceId}` : null,
    metadata,
    expiresAt,
  });

  // 4. Real-time WebSocket event dispatch
  try {
    const payload = {
      _id: notification._id,
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      teamId: notification.teamId,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };

    emitToUser(recipientId, "notification:new", payload);

    // Also push updated unread count
    const { unreadCount } = await getUnreadNotificationCount({ userId: recipientId });
    emitToUser(recipientId, "notification:count", { unreadCount });
  } catch (err) {
    console.error("Failed to emit notification socket event:", err);
  }

  return notification;
}

// Backward compatibility alias
export const createNotification = createDomainNotification;

/**
 * 2b. Explicitly targeted personal notifications with guaranteed single-event deduplication.
 *     Ensures only directly affected users are notified.
 *     If actorId === recipientId (e.g. Admin changes status of own task),
 *     generates exactly ONE notification for that user.
 */
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
  const uniqueRecipients = Array.from(
    new Set(
      rawList
        .filter(Boolean)
        .map((r) => (typeof r === "object" ? String(r._id || r.id || r) : String(r)))
    )
  ).filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (uniqueRecipients.length === 0) {
    return [];
  }

  const createdNotifications = [];
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
      allowSelfNotification: true, // Guarantees 1 notification when actor === recipient
    });
    if (notif) createdNotifications.push(notif);
  }

  return createdNotifications;
}

/**
 * 3. Create batch notifications for multiple recipients (e.g. channel invites, role permission changes)
 */
export async function createBatchDomainNotifications(notifications = []) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const validDocs = [];
  for (const item of notifications) {
    const {
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
    } = item;

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) continue;
    if (!allowSelfNotification && actorId && String(actorId) === String(recipientId)) continue;

    let finalTitle = title;
    let finalMessage = message;
    if ((!finalTitle || !finalMessage) && NotificationTemplates[type]) {
      const template = NotificationTemplates[type](metadata);
      if (!finalTitle) finalTitle = template.title;
      if (!finalMessage) finalMessage = template.message;
    }

    validDocs.push({
      recipientId,
      actorId: actorId && mongoose.Types.ObjectId.isValid(actorId) ? actorId : null,
      type,
      title: finalTitle || "System Notification",
      message: finalMessage || "You have a new update.",
      teamId: teamId && mongoose.Types.ObjectId.isValid(teamId) ? teamId : null,
      resourceType: resourceType || "SYSTEM",
      resourceId: resourceId ? String(resourceId) : null,
      resource: resourceId ? `${resourceType?.toLowerCase()}:${resourceId}` : null,
      metadata,
      expiresAt,
    });
  }

  if (validDocs.length === 0) return [];

  const createdDocs = await Notification.insertMany(validDocs);

  // Dispatch socket events
  for (const doc of createdDocs) {
    try {
      emitToUser(doc.recipientId, "notification:new", {
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
      });

      getUnreadNotificationCount({ userId: doc.recipientId }).then(({ unreadCount }) => {
        emitToUser(doc.recipientId, "notification:count", { unreadCount });
      }).catch(() => {});
    } catch {}
  }

  return createdDocs;
}

/**
 * 4. Get unread or all notifications for a user (paginated)
 */
export async function getUserNotifications({
  userId,
  unreadOnly = false,
  page = 1,
  limit = 20,
}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return { notifications: [], total: 0, page: 1, totalPages: 0, unreadCount: 0 };
  }

  const filter = { recipientId: userId };
  if (unreadOnly) {
    filter.readAt = null;
  }

  const { page: sanitizedPage, limit: sanitizedLimit, skip } = getPaginationParams({
    page,
    limit,
    defaultLimit: 20,
  });

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

  return {
    notifications,
    total,
    page: sanitizedPage,
    totalPages: getTotalPages(total, sanitizedLimit),
    unreadCount,
  };
}

/**
 * 5. Mark a specific notification as read (idempotent, securely scoped to user)
 */
export async function markNotificationAsRead({ notificationId, userId }) {
  if (
    !mongoose.Types.ObjectId.isValid(notificationId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }

  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  const { unreadCount } = await getUnreadNotificationCount({ userId });
  emitToUser(userId, "notification:count", { unreadCount });

  return updated;
}

/**
 * 6. Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return { updatedCount: 0, unreadCount: 0 };
  }

  const result = await Notification.updateMany(
    { recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  emitToUser(userId, "notification:count", { unreadCount: 0 });

  return { updatedCount: result.modifiedCount, unreadCount: 0 };
}

/**
 * 7. Delete an individual notification for current user
 */
export async function deleteNotification({ notificationId, userId }) {
  if (
    !mongoose.Types.ObjectId.isValid(notificationId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }

  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientId: userId,
  });

  const { unreadCount } = await getUnreadNotificationCount({ userId });
  emitToUser(userId, "notification:count", { unreadCount });

  return deleted;
}

/**
 * 8. Broadcast a system message to all active team members
 */
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
  if (!teamId || !senderId) {
    throw new NotFoundError("Team ID and Sender ID are required.");
  }

  const user = await User.findById(senderId);
  const membership = await Membership.findOne({ userId: senderId, teamId, status: "ACTIVE" });

  if (!user || !membership) {
    throw new ForbiddenError("You must be an active member of this team to send broadcasts.");
  }

  const memberRoles = await MembershipRole.find({ membershipId: membership._id, revokedAt: null }).populate("roleId", "name");
  const roleNames = memberRoles.map((mr) => mr.roleId?.name).filter(Boolean);

  const isSuperAdmin = Boolean(user.isSuperAdmin || roleNames.includes("Super Admin"));
  const isTeamAdmin = Boolean(isSuperAdmin || roleNames.includes("Team Admin"));

  if (!isTeamAdmin) {
    throw new ForbiddenError("Only Team Admins or Super Admins can send team broadcasts.");
  }

  const severity = type === "OUTAGE" ? "CRITICAL" : type === "MAINTENANCE" ? "WARNING" : "INFO";
  const finalStartsAt = startsAt ? new Date(startsAt) : new Date();
  const finalExpiresAt = expiresAt ? new Date(expiresAt) : null;

  // 1. Persist Broadcast / Bulletin document with validity window
  const broadcast = await Broadcast.create({
    teamId,
    senderId,
    title,
    body,
    type,
    severity,
    isSticky,
    requiresAck,
    startsAt: finalStartsAt,
    expiresAt: finalExpiresAt,
    status: "ACTIVE",
  });

  // 2. Real-time System Bulletin broadcast event (for active top alert banner)
  try {
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
    emitToTeam(teamId, "broadcast:new", bulletinPayload);
    emitToTeam(teamId, "bulletin:new", bulletinPayload);
  } catch (err) {
    console.error("Failed to emit broadcast socket event:", err);
  }

  // 3. Log audit event
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

/**
 * 9. Get all broadcasts for a team
 */
export async function getTeamBroadcasts({ teamId }) {
  if (!teamId) return [];

  const broadcasts = await Broadcast.find({ teamId })
    .sort({ createdAt: -1 })
    .populate("senderId", "name email");

  return broadcasts;
}

/**
 * 10. Query active system bulletins currently within their validity window.
 *     Visibility rule: startsAt <= now AND (expiresAt == null OR expiresAt > now).
 *     Expired bulletins (now > expiresAt) are never returned.
 */
export async function getActiveSystemBulletins({ teamId = null } = {}) {
  const now = new Date();

  const query = {
    status: "ACTIVE",
    startsAt: { $lte: now },
    $and: [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
    ],
  };

  if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
    query.$and.push({
      $or: [
        { teamId: null },
        { teamId: new mongoose.Types.ObjectId(teamId) },
      ],
    });
  }

  const bulletins = await Broadcast.find(query)
    .sort({ isSticky: -1, startsAt: -1 })
    .populate("senderId", "name email");

  return bulletins;
}

