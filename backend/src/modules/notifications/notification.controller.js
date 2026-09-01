import * as notificationService from "./notification.service.js";

/**
 * GET /api/notifications
 * Get logged-in user's notifications
 */
export async function getMyNotificationsController(req, res, next) {
  try {
    const userId = req.user.id;
    const { unreadOnly, page, limit } = req.query;

    const data = await notificationService.getUserNotifications({
      userId,
      unreadOnly: unreadOnly === "true",
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:notificationId/read
 * Mark a single notification as read
 */
export async function markNotificationAsReadController(req, res, next) {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await notificationService.markNotificationAsRead({
      notificationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsReadController(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllNotificationsAsRead(userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
