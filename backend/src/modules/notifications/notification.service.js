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

  let teamName = null;
  if (mongoose.Types.ObjectId.isValid(teamId)) {
    const teamDoc = await Team.findById(teamId).select("name");
    if (teamDoc) teamName = teamDoc.name;
  }

  const query = {
    $or: [
      { teamId: new mongoose.Types.ObjectId(teamId) },
      { teamId: null },
      { scope: "GLOBAL" },
      { scope: "WORKSPACE_SCOPED" },
    ],
  };

  const rawBroadcasts = await Broadcast.find(query)
    .sort({ createdAt: -1 })
    .populate("senderId", "name email");

  return rawBroadcasts.filter((b) => {
    // 1. Direct team-specific broadcast
    if (b.teamId && String(b.teamId) === String(teamId)) {
      return true;
    }
    // 2. Global broadcasts sent by Super Admin are visible to all users
    if (
      !b.scope ||
      b.scope === "GLOBAL" ||
      (b.targetWorkspaces || []).some((t) => typeof t === "string" && t.includes("All Workspaces"))
    ) {
      return true;
    }
    // 3. Workspace-scoped broadcasts: verify teamId or teamName matches
    if (b.scope === "WORKSPACE_SCOPED") {
      const targets = (b.targetWorkspaces || []).filter(
        (t) => typeof t === "string" && !t.includes("All Workspaces")
      );
      if (targets.length === 0) return false;
      return targets.some(
        (target) =>
          target === String(teamId) ||
          (teamName && target.trim().toLowerCase() === teamName.trim().toLowerCase())
      );
    }
    return false;
  });
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

  const rawBulletins = await Broadcast.find(query)
    .sort({ isSticky: -1, startsAt: -1 })
    .populate("senderId", "name email");

  let teamName = null;
  if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
    const teamDoc = await Team.findById(teamId).select("name");
    if (teamDoc) {
      teamName = teamDoc.name;
    }
  }

  // Filter bulletins based on delivery scope
  const filteredBulletins = rawBulletins.filter((b) => {
    // 1. Direct team-specific broadcast
    if (b.teamId) {
      return teamId && String(b.teamId) === String(teamId);
    }

    // 2. Global broadcasts are visible everywhere
    if (!b.scope || b.scope === "GLOBAL") {
      return true;
    }

    // 3. Workspace-scoped broadcasts: verify teamId or teamName matches
    if (b.scope === "WORKSPACE_SCOPED") {
      if (!teamId) return false;
      const targets = (b.targetWorkspaces || []).filter(
        (t) => typeof t === "string" && !t.includes("All Workspaces")
      );
      if (targets.length === 0) return false;
      return targets.some(
        (target) =>
          target === String(teamId) ||
          (teamName && target.trim().toLowerCase() === teamName.trim().toLowerCase())
      );
    }

    // 4. Other custom scopes (e.g. ROLE_SCOPED)
    return true;
  });

  return filteredBulletins.map((b) => formatBroadcastRecord(b));
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
    metrics: b.metrics || {
      targetedUsers: 0,
      viewedCount: 0,
      acknowledgedCount: 0,
    },
    workspaceBreakdown: b.workspaceBreakdown || [],
    roleBreakdown: b.roleBreakdown || [],
    isSticky: Boolean(b.isSticky),
    requiresAck: Boolean(b.requiresAck || b.ackMode === "MANDATORY_ACK"),
    startsAt: b.startsAt,
    expiresAt: b.expiresAt,
    createdAt: b.createdAt,
    createdBy: senderName,
    timeLabel:
      b.status === "SCHEDULED"
        ? `Scheduled for ${new Date(b.startsAt).toLocaleString()}`
        : b.status === "ENDED"
        ? "Ended"
        : "Live • Published",
    stickyNotice:
      b.ackMode === "MANDATORY_ACK"
        ? "Requires mandatory electronic acknowledgment"
        : "Active banner",
  };
}

/**
 * 11. Super Admin: List all platform system broadcasts
 */
export async function getAllBroadcasts({ status, type, search } = {}) {
  const query = {};

  if (status && status !== "ALL") {
    query.status = status;
  }
  if (type && type !== "ALL") {
    query.type = type;
  }
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { body: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const broadcasts = await Broadcast.find(query)
    .sort({ createdAt: -1 })
    .populate("senderId", "name email");

  return broadcasts.map((b) => formatBroadcastRecord(b));
}

/**
 * 12. Super Admin: Create and distribute a global system broadcast
 */
export async function createGlobalBroadcast({ senderId, data }) {
  const user = await User.findById(senderId);
  if (!user) {
    throw new NotFoundError("Sender user not found.");
  }

  const {
    title,
    message,
    body,
    type = "ANNOUNCEMENT",
    severity,
    scope = "GLOBAL",
    targetWorkspaces = [],
    targetRoles = [],
    ackMode = "READ_RECEIPT",
    cta,
    metrics,
    workspaceBreakdown,
    roleBreakdown,
    isSticky = false,
    requiresAck = false,
    startTiming = "NOW",
    scheduledDate,
    endTiming = "DISMISSED",
    expireDate,
    startsAt,
    expiresAt,
  } = data;

  if (!title || (!body && !message)) {
    throw new Error("Title and message/body are required for broadcast.");
  }

  const finalBody = (body || message).trim();
  const finalTitle = title.trim();

  const finalStartsAt =
    startTiming === "SCHEDULED" && scheduledDate
      ? new Date(scheduledDate)
      : startsAt
      ? new Date(startsAt)
      : new Date();

  const finalExpiresAt =
    endTiming === "DATE" && expireDate
      ? new Date(expireDate)
      : expiresAt
      ? new Date(expiresAt)
      : null;

  const now = new Date();
  const initialStatus = finalStartsAt > now ? "SCHEDULED" : "ACTIVE";

  // Calculate target reach
  let targetedCount = metrics?.targetedUsers;
  if (!targetedCount || targetedCount === 0) {
    if (scope === "GLOBAL") {
      targetedCount = await User.countDocuments({ status: { $ne: "INACTIVE" } });
    } else if (scope === "ROLE_SCOPED") {
      targetedCount = Math.max(1, (targetRoles?.length || 1) * 35);
    } else {
      targetedCount = Math.max(1, (targetWorkspaces?.length || 1) * 45);
    }
  }

  const sanitizedWorkspaces =
    scope === "GLOBAL"
      ? ["All Workspaces (Global Fleet)"]
      : (targetWorkspaces || []).filter(
          (w) => typeof w === "string" && !w.includes("All Workspaces")
        );

  const sanitizedRoles =
    scope === "ROLE_SCOPED"
      ? (targetRoles || []).filter(
          (r) => typeof r === "string" && !r.includes("All Roles")
        )
      : scope === "GLOBAL"
      ? ["All Roles"]
      : targetRoles || [];

  const broadcastDoc = await Broadcast.create({
    teamId: null, // Global / Fleet scope
    senderId,
    title: finalTitle,
    body: finalBody,
    type,
    severity: severity || (type === "OUTAGE" ? "CRITICAL" : type === "MAINTENANCE" ? "WARNING" : "INFO"),
    scope,
    targetWorkspaces: sanitizedWorkspaces.length > 0 ? sanitizedWorkspaces : (scope === "GLOBAL" ? ["All Workspaces (Global Fleet)"] : []),
    targetRoles: sanitizedRoles.length > 0 ? sanitizedRoles : ["All Roles"],
    ackMode,
    cta: cta?.label ? { label: cta.label, url: cta.url } : null,
    metrics: {
      targetedUsers: targetedCount || 1,
      viewedCount: metrics?.viewedCount || 0,
      acknowledgedCount: metrics?.acknowledgedCount || 0,
    },
    workspaceBreakdown: workspaceBreakdown || [],
    roleBreakdown: roleBreakdown || [],
    isSticky: Boolean(isSticky),
    requiresAck: Boolean(requiresAck || ackMode === "MANDATORY_ACK"),
    startsAt: finalStartsAt,
    expiresAt: finalExpiresAt,
    status: initialStatus,
  });

  const formatted = formatBroadcastRecord(await broadcastDoc.populate("senderId", "name email"));

  // 1. Real-time emit to targeted clients
  try {
    let targetedTeamDocs = [];
    if (scope === "WORKSPACE_SCOPED" && sanitizedWorkspaces.length > 0) {
      const validObjectIds = sanitizedWorkspaces.filter((w) => mongoose.Types.ObjectId.isValid(w));
      targetedTeamDocs = await Team.find({
        $or: [
          { _id: { $in: validObjectIds } },
          { name: { $in: sanitizedWorkspaces } },
        ],
      }).select("_id");
    }

    if (scope === "WORKSPACE_SCOPED" && targetedTeamDocs.length > 0) {
      for (const teamDoc of targetedTeamDocs) {
        emitToTeam(teamDoc._id, "broadcast:new", formatted);
        emitToTeam(teamDoc._id, "bulletin:new", formatted);
      }
      emitToUser(senderId, "broadcast:new", formatted);
    } else {
      emitToAll("broadcast:new", formatted);
      emitToAll("bulletin:new", formatted);
    }
  } catch (err) {
    console.error("Failed to emit broadcast socket event:", err);
  }

  // 2. Dispatch persistent in-app notifications to targeted users for high-priority broadcast
  try {
    let recipientUserIds = [];
    if (scope === "WORKSPACE_SCOPED" && sanitizedWorkspaces.length > 0) {
      const validObjectIds = sanitizedWorkspaces.filter((w) => mongoose.Types.ObjectId.isValid(w));
      const matchedTeams = await Team.find({
        $or: [
          { _id: { $in: validObjectIds } },
          { name: { $in: sanitizedWorkspaces } },
        ],
      }).select("_id");

      if (matchedTeams.length > 0) {
        const activeMembers = await Membership.find({
          teamId: { $in: matchedTeams.map((t) => t._id) },
          status: "ACTIVE",
        }).select("userId");
        recipientUserIds = [...new Set(activeMembers.map((m) => String(m.userId)))];
      }
    }

    if (recipientUserIds.length === 0 && scope === "GLOBAL") {
      const activeUsers = await User.find({ status: { $ne: "INACTIVE" } }).select("_id");
      recipientUserIds = activeUsers.map((u) => String(u._id));
    }

    for (const recipientId of recipientUserIds) {
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

  // 3. Log audit event
  logAuditEvent({
    actorId: senderId,
    action: "system.broadcast_published",
    targetType: "Broadcast",
    targetId: broadcastDoc._id,
    metadata: {
      title: finalTitle,
      type,
      scope,
      status: initialStatus,
      targetedUsers: targetedCount,
    },
  });

  return formatted;
}

/**
 * 13. Super Admin: Update an existing broadcast
 */
export async function updateBroadcast({ broadcastId, updates, senderId }) {
  if (!broadcastId || !mongoose.Types.ObjectId.isValid(broadcastId)) {
    throw new NotFoundError("Invalid broadcast ID.");
  }

  const broadcast = await Broadcast.findById(broadcastId);
  if (!broadcast) {
    throw new NotFoundError("Broadcast not found.");
  }

  if (updates.title !== undefined) broadcast.title = updates.title.trim();
  if (updates.body !== undefined || updates.message !== undefined) {
    broadcast.body = (updates.body || updates.message).trim();
  }
  if (updates.type !== undefined) broadcast.type = updates.type;
  if (updates.severity !== undefined) broadcast.severity = updates.severity;
  if (updates.scope !== undefined) broadcast.scope = updates.scope;
  if (updates.targetWorkspaces !== undefined) {
    const effScope = updates.scope || broadcast.scope;
    broadcast.targetWorkspaces =
      effScope === "GLOBAL"
        ? ["All Workspaces (Global Fleet)"]
        : (updates.targetWorkspaces || []).filter(
            (w) => typeof w === "string" && !w.includes("All Workspaces")
          );
  }
  if (updates.targetRoles !== undefined) {
    const effScope = updates.scope || broadcast.scope;
    broadcast.targetRoles =
      effScope === "ROLE_SCOPED"
        ? (updates.targetRoles || []).filter(
            (r) => typeof r === "string" && !r.includes("All Roles")
          )
        : effScope === "GLOBAL"
        ? ["All Roles"]
        : updates.targetRoles || [];
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

  try {
    let targetedTeamDocs = [];
    const effWorkspaces = (formatted.targetWorkspaces || []).filter(
      (w) => typeof w === "string" && !w.includes("All Workspaces")
    );
    if (formatted.scope === "WORKSPACE_SCOPED" && effWorkspaces.length > 0) {
      const validObjectIds = effWorkspaces.filter((w) => mongoose.Types.ObjectId.isValid(w));
      targetedTeamDocs = await Team.find({
        $or: [
          { _id: { $in: validObjectIds } },
          { name: { $in: effWorkspaces } },
        ],
      }).select("_id");
    }

    if (formatted.scope === "WORKSPACE_SCOPED" && targetedTeamDocs.length > 0) {
      for (const teamDoc of targetedTeamDocs) {
        emitToTeam(teamDoc._id, "broadcast:updated", formatted);
        emitToTeam(teamDoc._id, "bulletin:updated", formatted);
      }
      emitToUser(senderId, "broadcast:updated", formatted);
    } else {
      emitToAll("broadcast:updated", formatted);
      emitToAll("bulletin:updated", formatted);
    }
  } catch (err) {
    console.error("Failed to emit broadcast:updated socket event:", err);
  }

  logAuditEvent({
    actorId: senderId,
    action: "system.broadcast_updated",
    targetType: "Broadcast",
    targetId: broadcast._id,
    metadata: { updates },
  });

  return formatted;
}

/**
 * 14. Super Admin: Delete a broadcast record
 */
export async function deleteBroadcast({ broadcastId, senderId }) {
  if (!broadcastId || !mongoose.Types.ObjectId.isValid(broadcastId)) {
    throw new NotFoundError("Invalid broadcast ID.");
  }

  const broadcast = await Broadcast.findByIdAndDelete(broadcastId);
  if (!broadcast) {
    throw new NotFoundError("Broadcast not found.");
  }

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


