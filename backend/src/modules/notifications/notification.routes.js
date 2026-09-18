import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import {
  requireSuperAdmin,
  requireTeamMemberWhenTeamContextPresent,
} from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import * as c from "./notification.controller.js";
import {
  activeBulletinsSchema,
  broadcastIdParamSchema,
  createGlobalBroadcastSchema,
  listNotificationsSchema,
  notificationIdParamSchema,
  updateGlobalBroadcastSchema,
} from "./notification.validation.js";

const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get("/bulletins/active", validateRequest(activeBulletinsSchema), requireTeamMemberWhenTeamContextPresent(), c.getActiveBulletinsController);
notificationRouter.get("/broadcasts", requireSuperAdmin(), c.getAllBroadcastsController);
notificationRouter.post("/broadcasts", validateRequest(createGlobalBroadcastSchema), requireSuperAdmin(), c.createGlobalBroadcastController);
notificationRouter.patch("/broadcasts/:broadcastId", validateRequest(updateGlobalBroadcastSchema), requireSuperAdmin(), c.updateBroadcastController);
notificationRouter.delete("/broadcasts/:broadcastId", validateRequest(broadcastIdParamSchema), requireSuperAdmin(), c.deleteBroadcastController);

notificationRouter.get("/", validateRequest(listNotificationsSchema), c.getMyNotificationsController);
notificationRouter.get("/unread-count", c.getUnreadCountController);
notificationRouter.patch("/read-all", c.markAllNotificationsAsReadController);
notificationRouter.patch("/:notificationId/read", validateRequest(notificationIdParamSchema), c.markNotificationAsReadController);
notificationRouter.delete("/:notificationId", validateRequest(notificationIdParamSchema), c.deleteNotificationController);

export default notificationRouter;
