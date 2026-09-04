import AuditLog from "./audit-log.model.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";

/**
 * Writes a single audit event record.
 * Non-blocking: a write failure must never crash the caller.
 */
export async function logAuditEvent({
  actorId = null,
  action,          // e.g. "access_request.approved"
  targetType,      // e.g. "AccessRequest"
  targetId = null,
  teamId = null,
  result = "SUCCESS",
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await AuditLog.create({
      actorId,
      action,
      targetType,
      targetId,
      teamId,
      result,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

/**
 * Paginated query of audit logs for a team, with optional filters.
 */
export async function getAuditLogs({
  teamId,
  filters = {},
  page = 1,
  limit = 20,
}) {
  const filter = { teamId };

  if (filters.actorId) filter.actorId = filters.actorId;
  if (filters.action) filter.action = filters.action;
  if (filters.result) filter.result = filters.result;

  if (filters.dateFrom || filters.dateTo) {
    filter.createdAt = {};
    if (filters.dateFrom) filter.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) filter.createdAt.$lte = new Date(filters.dateTo);
  }

  const { page: sanitizedPage, limit: sanitizedLimit, skip } = getPaginationParams({ page, limit, defaultLimit: 20 });

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sanitizedLimit)
      .populate("actorId", "name email"),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    total,
    page: sanitizedPage,
    totalPages: getTotalPages(total, sanitizedLimit),
  };
}