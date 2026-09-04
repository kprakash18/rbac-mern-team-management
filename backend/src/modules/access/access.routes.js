import { Router } from "express";
import * as accessController from "./access.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

// Note: mergeParams: true allows capturing :teamId from parent router mount
const accessRouter = Router({ mergeParams: true });

// --- 1. Request Submission & Retrieval ---
accessRouter.post(
  "/",
  authenticate,
  requirePermission("access_request.create"),
  accessController.createAccessRequestController
);

accessRouter.get(
  "/",
  authenticate,
  requirePermission("access_request.read"),
  accessController.getAccessRequestsByTeamController
);

accessRouter.get(
  "/:requestId",
  authenticate,
  requirePermission("access_request.read"),
  accessController.getAccessRequestByIdController
);

// --- 2. Requester Self-Correction & Withdrawal ---
accessRouter.patch(
  "/:requestId",
  authenticate,
  requirePermission("access_request.create"),
  accessController.updateAccessRequestController
);

accessRouter.delete(
  "/:requestId",
  authenticate,
  requirePermission("access_request.cancel"),
  accessController.deleteAccessRequestController
);

// --- 3. Reviewer Approvals & Rejections ---
accessRouter.post(
  "/:requestId/approve",
  authenticate,
  requirePermission("access_request.approve"),
  accessController.approveAccessRequestController
);

accessRouter.post(
  "/:requestId/reject",
  authenticate,
  requirePermission("access_request.reject"),
  accessController.rejectAccessRequestController
);

// --- 4. Early Revocation via Request ID ---
accessRouter.delete(
  "/:requestId/revoke",
  authenticate,
  requirePermission("access_grant.revoke"),
  accessController.revokeByRequestIdController
);

// --- 5. Grant Revocation (by grantId) ---
accessRouter.delete(
  "/grants/:grantId",
  authenticate,
  requirePermission("access_grant.revoke"),
  accessController.revokeAccessGrantController
);


export default accessRouter;
