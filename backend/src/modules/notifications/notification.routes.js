import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import {
  getMyNotificationsController,
  getUnreadCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
  getActiveBulletinsController,
  getAllBroadcastsController,
  createGlobalBroadcastController,
  updateBroadcastController,
  deleteBroadcastController,
} from "./notification.controller.js";

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(authenticate);

// Global & team bulletins
notificationRouter.get("/bulletins/active", getActiveBulletinsController);

// Super Admin Broadcast Management
notificationRouter.get("/broadcasts", getAllBroadcastsController);
notificationRouter.post("/broadcasts", createGlobalBroadcastController);
notificationRouter.patch("/broadcasts/:broadcastId", updateBroadcastController);
notificationRouter.delete("/broadcasts/:broadcastId", deleteBroadcastController);

// User in-app notifications
notificationRouter.get("/", getMyNotificationsController);
notificationRouter.get("/unread-count", getUnreadCountController);
notificationRouter.patch("/read-all", markAllNotificationsAsReadController);
notificationRouter.patch("/:notificationId/read", markNotificationAsReadController);
notificationRouter.delete("/:notificationId", deleteNotificationController);

export default notificationRouter;

