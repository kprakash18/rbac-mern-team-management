import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import {
  getMyNotificationsController,
  getUnreadCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
  getActiveBulletinsController,
} from "./notification.controller.js";

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(authenticate);

notificationRouter.get("/bulletins/active", getActiveBulletinsController);
notificationRouter.get("/", getMyNotificationsController);
notificationRouter.get("/unread-count", getUnreadCountController);
notificationRouter.patch("/read-all", markAllNotificationsAsReadController);
notificationRouter.patch("/:notificationId/read", markNotificationAsReadController);
notificationRouter.delete("/:notificationId", deleteNotificationController);

export default notificationRouter;
