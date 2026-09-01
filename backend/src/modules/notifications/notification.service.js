import Notification from "./notification.model.js";

/**
 * 1. Create and persist a new notification
 */
export async function createNotification({
  recipientId,
  type,
  title,
  message,
  teamId = null,
  resource = null,
  metadata = {},
  expiresAt = null,
}) {
  return Notification.create({
    recipientId,
    type,
    title,
    message,
    teamId,
    resource,
    metadata,
    expiresAt,
  });
}

/**
 * 2. Get unread or all notifications for a user (paginated)
 */
export async function getUserNotifications({
  userId,
  unreadOnly = false,
  page = 1,
  limit = 20,
}) {
  const filter = { recipientId: userId };
  if (unreadOnly) {
    filter.readAt = null;
  }

  const sanitizedPage = Math.max(1, parseInt(page, 10) || 1);
  const sanitizedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sanitizedLimit)
      .populate("teamId", "name slug"),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    total,
    page: sanitizedPage,
    totalPages: Math.ceil(total / sanitizedLimit),
  };
}

/**
 * 3. Mark a specific notification as read
 */
export async function markNotificationAsRead({ notificationId, userId }) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  );
}

/**
 * 4. Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId) {
  const result = await Notification.updateMany(
    { recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return { updatedCount: result.modifiedCount };
}
