import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { getTeamAuditLogs, getAllAuditLogs } from "./audit.controller.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, requirePermission("audit.read"), getTeamAuditLogs);

export const globalAuditRouter = Router();
globalAuditRouter.get("/", authenticate, requirePermission("audit.read"), getAllAuditLogs);

export default router;