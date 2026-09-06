import { Router } from "express";
import * as c from "./access.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const accessRouter = Router({ mergeParams: true });
accessRouter.post("/", authenticate, requirePermission("access_request.create"), c.createAccessRequestController);
accessRouter.get("/", authenticate, c.getAccessRequestsByTeamController);
accessRouter.get("/:requestId", authenticate, c.getAccessRequestByIdController);
accessRouter.patch("/:requestId", authenticate, requirePermission("access_request.create"), c.updateAccessRequestController);
accessRouter.delete("/:requestId", authenticate, requirePermission("access_request.cancel"), c.deleteAccessRequestController);
accessRouter.post("/:requestId/approve", authenticate, requirePermission("access_request.approve"), c.approveAccessRequestController);
accessRouter.post("/:requestId/reject", authenticate, requirePermission("access_request.reject"), c.rejectAccessRequestController);
accessRouter.delete("/:requestId/revoke", authenticate, requirePermission("access_grant.revoke"), c.revokeByRequestIdController);
accessRouter.delete("/grants/:grantId", authenticate, requirePermission("access_grant.revoke"), c.revokeAccessGrantController);

export const globalAccessRouter = Router();
globalAccessRouter.get("/", authenticate, c.getAllAccessRequestsController);
globalAccessRouter.get("/:requestId", authenticate, c.getAccessRequestByIdController);
globalAccessRouter.post("/:requestId/approve", authenticate, c.approveAccessRequestController);
globalAccessRouter.post("/:requestId/reject", authenticate, c.rejectAccessRequestController);
globalAccessRouter.delete("/:requestId/revoke", authenticate, c.revokeByRequestIdController);
globalAccessRouter.delete("/:requestId", authenticate, c.deleteAccessRequestController);

export default accessRouter;
