import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { getTeamAuditLogs } from "./audit.controller.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, requirePermission("audit.read"), getTeamAuditLogs);

export default router;