import { getAuditLogs } from "./audit.service.js";

export async function getTeamAuditLogs(req, res, next) {
  try {
    const { teamId } = req.params;

    const { actorId, action, result, dateFrom, dateTo, page, limit } = req.query;

    const auditData = await getAuditLogs({
      teamId,
      filters: { actorId, action, result, dateFrom, dateTo },
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: auditData,
    });
  } catch (error) {
    next(error);
  }
}