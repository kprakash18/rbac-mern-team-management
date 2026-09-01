import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import {
  getMyNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from "./notification.controller.js";

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(authenticate);

notificationRouter.get("/", getMyNotificationsController);
notificationRouter.patch("/read-all", markAllNotificationsAsReadController);
notificationRouter.patch("/:notificationId/read", markNotificationAsReadController);

export default notificationRouter;
