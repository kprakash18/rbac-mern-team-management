import { Router } from "express";
import * as c from "./access.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import {
  requireActiveTeamMember,
  requirePermission,
  requireSuperAdmin,
} from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import {
  accessGrantIdParamSchema,
  accessRequestIdParamSchema,
  approveAccessRequestSchema,
  createAccessRequestSchema,
  globalAccessRequestIdParamSchema,
  globalApproveAccessRequestSchema,
  globalRejectAccessRequestSchema,
  rejectAccessRequestSchema,
  updateAccessRequestSchema,
} from "./access.validation.js";

const accessRouter = Router({ mergeParams: true });
accessRouter.post("/", authenticate, validateRequest(createAccessRequestSchema), requirePermission("access_request.create"), c.createAccessRequestController);
accessRouter.get("/", authenticate, requireActiveTeamMember(), c.getAccessRequestsByTeamController);
accessRouter.get("/:requestId", authenticate, validateRequest(accessRequestIdParamSchema), requireActiveTeamMember(), c.getAccessRequestByIdController);
accessRouter.patch("/:requestId", authenticate, validateRequest(updateAccessRequestSchema), requirePermission("access_request.create"), c.updateAccessRequestController);
accessRouter.delete("/:requestId", authenticate, validateRequest(accessRequestIdParamSchema), requirePermission("access_request.cancel"), c.deleteAccessRequestController);
accessRouter.post("/:requestId/approve", authenticate, validateRequest(approveAccessRequestSchema), requirePermission("access_request.approve"), c.approveAccessRequestController);
accessRouter.post("/:requestId/reject", authenticate, validateRequest(rejectAccessRequestSchema), requirePermission("access_request.reject"), c.rejectAccessRequestController);
accessRouter.delete("/:requestId/revoke", authenticate, validateRequest(accessRequestIdParamSchema), requirePermission("access_grant.revoke"), c.revokeByRequestIdController);
accessRouter.delete("/grants/:grantId", authenticate, validateRequest(accessGrantIdParamSchema), requirePermission("access_grant.revoke"), c.revokeAccessGrantController);

export const globalAccessRouter = Router();
globalAccessRouter.use(authenticate, requireSuperAdmin());
globalAccessRouter.get("/", c.getAllAccessRequestsController);
globalAccessRouter.get("/:requestId", validateRequest(globalAccessRequestIdParamSchema), c.getAccessRequestByIdController);
globalAccessRouter.post("/:requestId/approve", validateRequest(globalApproveAccessRequestSchema), c.approveAccessRequestController);
globalAccessRouter.post("/:requestId/reject", validateRequest(globalRejectAccessRequestSchema), c.rejectAccessRequestController);
globalAccessRouter.delete("/:requestId/revoke", validateRequest(globalAccessRequestIdParamSchema), c.revokeByRequestIdController);
globalAccessRouter.delete("/:requestId", validateRequest(globalAccessRequestIdParamSchema), c.deleteAccessRequestController);

export default accessRouter;
