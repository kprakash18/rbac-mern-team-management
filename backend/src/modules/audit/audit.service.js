import AuditLog from "./audit-log.model.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";
import { emitToAll } from "../../realtime/event-emitter.js";
import mongoose from "mongoose";

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
    const logDoc = await AuditLog.create({
      actorId: actorId && mongoose.Types.ObjectId.isValid(actorId) ? actorId : null,
      action,
      targetType: targetType || "System",
      targetId: targetId && mongoose.Types.ObjectId.isValid(targetId) ? targetId : null,
      teamId: teamId && mongoose.Types.ObjectId.isValid(teamId) ? teamId : null,
      result: result ? result.toUpperCase() : "SUCCESS",
      metadata: metadata || {},
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || null,
    });

    // Populate and broadcast to super admin live feeds
    try {
      const populated = await logDoc.populate([
        { path: "actorId", select: "name email" },
        { path: "teamId", select: "name" },
      ]);
      emitToAll("audit:new", populated);
    } catch {}
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

/**
 * Paginated query of audit logs for a specific team or the entire platform (teamId = null).
 */
export async function getAuditLogs({
  teamId = null,
  filters = {},
  page = 1,
  limit = 50,
}) {
  const filter = {};

  if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
    filter.teamId = teamId;
  }

  if (filters.actorId && mongoose.Types.ObjectId.isValid(filters.actorId)) {
    filter.actorId = filters.actorId;
  }
  if (filters.action && filters.action !== "ALL") {
    filter.action = { $regex: filters.action.trim(), $options: "i" };
  }
  if (filters.result && filters.result !== "ALL") {
    filter.result = filters.result.toUpperCase();
  }
  if (filters.targetType && filters.targetType !== "ALL") {
    filter.targetType = filters.targetType;
  }

  if (filters.search && filters.search.trim()) {
    const searchRegex = { $regex: filters.search.trim(), $options: "i" };
    filter.$or = [
      { action: searchRegex },
      { targetType: searchRegex },
      { ipAddress: searchRegex },
      { userAgent: searchRegex },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    filter.createdAt = {};
    if (filters.dateFrom) filter.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) filter.createdAt.$lte = new Date(filters.dateTo);
  }

  const { page: sanitizedPage, limit: sanitizedLimit, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sanitizedLimit)
      .populate("actorId", "name email avatar")
      .populate("teamId", "name"),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    total,
    page: sanitizedPage,
    totalPages: getTotalPages(total, sanitizedLimit),
  };
}