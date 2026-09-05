import * as notificationService from "./notification.service.js";

/**
 * GET /api/notifications
 * Get logged-in user's notifications (paginated, unreadOnly filter)
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
 * GET /api/notifications/unread-count
 * Lightweight unread notifications count
 */
export async function getUnreadCountController(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await notificationService.getUnreadNotificationCount({ userId });

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

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 */
export async function deleteNotificationController(req, res, next) {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const result = await notificationService.deleteNotification({
      notificationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: { deleted: Boolean(result) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/teams/:teamId/broadcasts
 * Broadcast a system message to all active members of a team
 */
export async function createTeamBroadcastController(req, res, next) {
  try {
    const senderId = req.user.id;
    const { teamId } = req.params;
    const { title, message, body, type, isSticky, requiresAck, startsAt, expiresAt } = req.body;

    const broadcast = await notificationService.broadcastToTeam({
      teamId,
      senderId,
      title,
      body: body || message,
      type,
      isSticky,
      requiresAck,
      startsAt,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      data: broadcast,
      message: "Broadcast dispatched to team members successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/teams/:teamId/broadcasts
 * Fetch system broadcasts sent to a team
 */
export async function getTeamBroadcastsController(req, res, next) {
  try {
    const { teamId } = req.params;

    const broadcasts = await notificationService.getTeamBroadcasts({ teamId });

    return res.status(200).json({
      success: true,
      data: broadcasts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notifications/bulletins/active
 * Fetch currently active system bulletins within valid time window (startsAt <= now <= expiresAt)
 */
export async function getActiveBulletinsController(req, res, next) {
  try {
    const teamId = req.query.teamId || null;
    const bulletins = await notificationService.getActiveSystemBulletins({ teamId });

    return res.status(200).json({
      success: true,
      data: bulletins,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notifications/broadcasts
 * Super Admin: List all system broadcasts
 */
export async function getAllBroadcastsController(req, res, next) {
  try {
    const { status, type, search } = req.query;
    const broadcasts = await notificationService.getAllBroadcasts({ status, type, search });

    return res.status(200).json({
      success: true,
      data: broadcasts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notifications/broadcasts
 * Super Admin: Create a new global system broadcast
 */
export async function createGlobalBroadcastController(req, res, next) {
  try {
    const senderId = req.user.id;
    const broadcast = await notificationService.createGlobalBroadcast({
      senderId,
      data: req.body,
    });

    return res.status(201).json({
      success: true,
      data: broadcast,
      message: "System broadcast published successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/broadcasts/:broadcastId
 * Super Admin: Update/End Early a system broadcast
 */
export async function updateBroadcastController(req, res, next) {
  try {
    const senderId = req.user.id;
    const { broadcastId } = req.params;
    const broadcast = await notificationService.updateBroadcast({
      broadcastId,
      updates: req.body,
      senderId,
    });

    return res.status(200).json({
      success: true,
      data: broadcast,
      message: "System broadcast updated successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notifications/broadcasts/:broadcastId
 * Super Admin: Delete a system broadcast
 */
export async function deleteBroadcastController(req, res, next) {
  try {
    const senderId = req.user.id;
    const { broadcastId } = req.params;
    const result = await notificationService.deleteBroadcast({
      broadcastId,
      senderId,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "System broadcast deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}


