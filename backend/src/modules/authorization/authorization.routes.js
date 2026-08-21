import express from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePasswordChangeCompleted } from "../../common/middleware/require-password-change.js";
import {
  getMyPermissionsController,
  checkPermissionController,
} from "./authorization.controller.js";

const router = express.Router();

// All authorization routes require authenticated session & valid password status
router.use(authenticate, requirePasswordChangeCompleted);

/**
 * GET /api/authorization/permissions?teamId=...
 * Returns all active deduplicated permissions for the logged-in user in the requested team.
 */
router.get("/permissions", getMyPermissionsController);

/**
 * POST /api/authorization/check
 * Body: { teamId, permission, resource? }
 * Explicitly evaluates whether an action on a resource is permitted.
 */
router.post("/check", checkPermissionController);

export default router;
