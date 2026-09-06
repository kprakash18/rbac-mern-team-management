import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import * as c from "./notification.controller.js";

const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get("/bulletins/active", c.getActiveBulletinsController);
notificationRouter.get("/broadcasts", c.getAllBroadcastsController);
notificationRouter.post("/broadcasts", c.createGlobalBroadcastController);
notificationRouter.patch("/broadcasts/:broadcastId", c.updateBroadcastController);
notificationRouter.delete("/broadcasts/:broadcastId", c.deleteBroadcastController);

notificationRouter.get("/", c.getMyNotificationsController);
notificationRouter.get("/unread-count", c.getUnreadCountController);
notificationRouter.patch("/read-all", c.markAllNotificationsAsReadController);
notificationRouter.patch("/:notificationId/read", c.markNotificationAsReadController);
notificationRouter.delete("/:notificationId", c.deleteNotificationController);

export default notificationRouter;
