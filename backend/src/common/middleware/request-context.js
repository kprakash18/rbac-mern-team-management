import crypto from "node:crypto";
import mongoose from "mongoose";
import Membership from "../../modules/memberships/membership.model.js";
import { isSuperAdmin } from "../../modules/authorization/authorization.service.js";

export function resolveTeamId(req) {
  return (
    req.params?.teamId ||
    req.query?.teamId ||
    req.body?.teamId ||
    req.headers["x-team-id"] ||
    null
  );
}

export async function buildRequestContext(req) {
  const userId = req.user?.id || null;
  const teamId = resolveTeamId(req);
  const userIsSuperAdmin = Boolean(
    req.user?.isSuperAdmin ?? (userId ? await isSuperAdmin(userId) : false)
  );

  let membership = null;
  if (userId && teamId && mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(teamId)) {
    membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" })
      .select("_id userId teamId status roleIds")
      .lean();
  }

  return {
    requestId: req.requestId || req.headers["x-request-id"] || crypto.randomUUID(),
    actor: req.user || null,
    actorId: userId,
    teamId,
    membership,
    isSuperAdmin: userIsSuperAdmin,
  };
}

export async function ensureRequestContext(req) {
  if (!req.context) {
    req.context = await buildRequestContext(req);
  }
  return req.context;
}

export function requestContext() {
  return async (req, res, next) => {
    try {
      req.context = await buildRequestContext(req);
      res.setHeader("x-request-id", req.context.requestId);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default requestContext;
