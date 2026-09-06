import { asyncHandler } from "../../common/utils/async-handler.js";
import * as notificationService from "./notification.service.js";

export const getMyNotificationsController = asyncHandler(async (req, res) => {
  const data = await notificationService.getUserNotifications({
    userId: req.user.id,
    unreadOnly: req.query.unreadOnly === "true",
    page: req.query.page,
    limit: req.query.limit,
  });
  res.status(200).json({ success: true, data });
});

export const getUnreadCountController = asyncHandler(async (req, res) => {
  const data = await notificationService.getUnreadNotificationCount({ userId: req.user.id });
  res.status(200).json({ success: true, data });
});

export const markNotificationAsReadController = asyncHandler(async (req, res) => {
  const data = await notificationService.markNotificationAsRead({
    notificationId: req.params.notificationId,
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data });
});

export const markAllNotificationsAsReadController = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllNotificationsAsRead(req.user.id);
  res.status(200).json({ success: true, data });
});

export const deleteNotificationController = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification({
    notificationId: req.params.notificationId,
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: { deleted: Boolean(result) } });
});

export const createTeamBroadcastController = asyncHandler(async (req, res) => {
  const { title, message, body, type, isSticky, requiresAck, startsAt, expiresAt } = req.body;
  const broadcast = await notificationService.broadcastToTeam({
    teamId: req.params.teamId,
    senderId: req.user.id,
    title,
    body: body || message,
    type,
    isSticky,
    requiresAck,
    startsAt,
    expiresAt,
  });
  res.status(201).json({ success: true, data: broadcast, message: "Broadcast dispatched to team members successfully." });
});

export const getTeamBroadcastsController = asyncHandler(async (req, res) => {
  const data = await notificationService.getTeamBroadcasts({ teamId: req.params.teamId });
  res.status(200).json({ success: true, data });
});

export const getActiveBulletinsController = asyncHandler(async (req, res) => {
  const data = await notificationService.getActiveSystemBulletins({ teamId: req.query.teamId || null });
  res.status(200).json({ success: true, data });
});

export const getAllBroadcastsController = asyncHandler(async (req, res) => {
  const data = await notificationService.getAllBroadcasts(req.query);
  res.status(200).json({ success: true, data });
});

export const createGlobalBroadcastController = asyncHandler(async (req, res) => {
  const data = await notificationService.createGlobalBroadcast({
    senderId: req.user.id,
    data: req.body,
  });
  res.status(201).json({ success: true, data, message: "System broadcast published successfully." });
});

export const updateBroadcastController = asyncHandler(async (req, res) => {
  const data = await notificationService.updateBroadcast({
    broadcastId: req.params.broadcastId,
    updates: req.body,
    senderId: req.user.id,
  });
  res.status(200).json({ success: true, data, message: "System broadcast updated successfully." });
});

export const deleteBroadcastController = asyncHandler(async (req, res) => {
  const data = await notificationService.deleteBroadcast({
    broadcastId: req.params.broadcastId,
    senderId: req.user.id,
  });
  res.status(200).json({ success: true, data, message: "System broadcast deleted successfully." });
});
