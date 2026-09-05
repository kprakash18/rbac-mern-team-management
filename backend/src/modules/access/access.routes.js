import { Router } from "express";
import * as accessController from "./access.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

// Note: mergeParams: true allows capturing :teamId from parent router mount
const accessRouter = Router({ mergeParams: true });

// --- 1. Request Submission & Retrieval (Team-Scoped) ---
accessRouter.post(
  "/",
  authenticate,
  requirePermission("access_request.create"),
  accessController.createAccessRequestController
);

accessRouter.get(
  "/",
  authenticate,
  accessController.getAccessRequestsByTeamController
);

accessRouter.get(
  "/:requestId",
  authenticate,
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

// --- 6. Global Access Requests Router (for Super Admin across all teams) ---
export const globalAccessRouter = Router();

globalAccessRouter.get(
  "/",
  authenticate,
  accessController.getAllAccessRequestsController
);

globalAccessRouter.get(
  "/:requestId",
  authenticate,
  accessController.getAccessRequestByIdController
);

globalAccessRouter.post(
  "/:requestId/approve",
  authenticate,
  accessController.approveAccessRequestController
);

globalAccessRouter.post(
  "/:requestId/reject",
  authenticate,
  accessController.rejectAccessRequestController
);

globalAccessRouter.delete(
  "/:requestId/revoke",
  authenticate,
  accessController.revokeByRequestIdController
);

globalAccessRouter.delete(
  "/:requestId",
  authenticate,
  accessController.deleteAccessRequestController
);

export default accessRouter;
