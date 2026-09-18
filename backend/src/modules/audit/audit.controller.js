import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/http/response.js";
import { getAuditLogs } from "./audit.service.js";

export const getTeamAuditLogs = asyncHandler(async (req, res) => {
  const { actorId, action, result, targetType, search, dateFrom, dateTo, page, limit } = req.query;
  const auditData = await getAuditLogs({
    teamId: req.params.teamId,
    filters: { actorId, action, result, targetType, search, dateFrom, dateTo },
    page,
    limit,
  });
  sendSuccess(res, { data: auditData });
});

export const getAllAuditLogs = asyncHandler(async (req, res) => {
  const { teamId, actorId, action, result, targetType, search, dateFrom, dateTo, page, limit } = req.query;
  const auditData = await getAuditLogs({
    teamId: teamId || null,
    filters: { actorId, action, result, targetType, search, dateFrom, dateTo },
    page,
    limit,
  });
  sendSuccess(res, { data: auditData });
});
