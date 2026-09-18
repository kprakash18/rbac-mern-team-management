import { can, isSuperAdmin } from "../../modules/authorization/authorization.service.js";
import { ForbiddenError, BadRequestError } from "../errors/index.js";
import { ensureRequestContext } from "./request-context.js";

export function requirePermission(permissionKey, getResourceId = null) {
  return async (req, res, next) => {
    try {
      const context = await ensureRequestContext(req);
      const userId = context.actorId;
      const teamId = context.teamId;

      const userIsSuperAdmin = context.isSuperAdmin;
      if (userIsSuperAdmin) {
        req.authContext = { teamId: teamId || null, permissionKey, resource: null };
        return next();
      }

      if (!teamId && allowsGlobalPermissionRead(permissionKey)) {
        req.authContext = { teamId: null, permissionKey, resource: null };
        return next();
      }

      if (!teamId) {
        throw new BadRequestError(
          "Team context (teamId) is required for authorization.",
          "MISSING_TEAM_CONTEXT"
        );
      }

      const resource = getResourceId
        ? getResourceId(req)
        : req.params?.taskId || req.params?.resourceId || null;

      let allowed = false;
      if (Array.isArray(permissionKey)) {
        for (const pk of permissionKey) {
          if (await can(userId, teamId, pk, resource)) {
            allowed = true;
            break;
          }
        }
      } else {
        allowed = await can(userId, teamId, permissionKey, resource);
      }

      if (!allowed) {
        const permLabel = Array.isArray(permissionKey) ? permissionKey.join(" or ") : permissionKey;
        throw new ForbiddenError(
          `You do not have permission ('${permLabel}') to perform this action in this team context.`,
          "INSUFFICIENT_PERMISSIONS"
        );
      }

      req.authContext = { teamId, permissionKey, resource };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireSuperAdmin() {
  return async (req, res, next) => {
    try {
      const context = await ensureRequestContext(req);
      const userIsSuperAdmin = context.isSuperAdmin || (await isSuperAdmin(context.actorId));

      if (!userIsSuperAdmin) {
        throw new ForbiddenError(
          "Platform Super Admin privileges are required for this action.",
          "SUPER_ADMIN_REQUIRED"
        );
      }

      req.authContext = {
        ...(req.authContext || {}),
        teamId: context.teamId || null,
        permissionKey: "platform.super_admin",
        resource: null,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireActiveTeamMember() {
  return async (req, res, next) => {
    try {
      const context = await ensureRequestContext(req);

      if (context.isSuperAdmin) {
        req.authContext = {
          ...(req.authContext || {}),
          teamId: context.teamId || null,
          permissionKey: "team.member_or_super_admin",
          resource: null,
        };
        return next();
      }

      if (!context.teamId) {
        throw new BadRequestError(
          "Team context (teamId) is required for this action.",
          "MISSING_TEAM_CONTEXT"
        );
      }

      if (!context.membership) {
        throw new ForbiddenError(
          "You must be an active member of this team to perform this action.",
          "ACTIVE_MEMBERSHIP_REQUIRED"
        );
      }

      req.authContext = {
        ...(req.authContext || {}),
        teamId: context.teamId,
        permissionKey: "team.member",
        resource: null,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireSelfOrSuperAdmin(getTargetUserId = (req) => req.params?.userId) {
  return async (req, res, next) => {
    try {
      const context = await ensureRequestContext(req);
      const targetUserId = getTargetUserId(req);
      const isSelf = context.actorId && targetUserId && String(context.actorId) === String(targetUserId);

      if (context.isSuperAdmin || isSelf) {
        req.authContext = {
          ...(req.authContext || {}),
          teamId: context.teamId || null,
          permissionKey: isSelf ? "user.self_update" : "platform.super_admin",
          resource: targetUserId || null,
        };
        return next();
      }

      throw new ForbiddenError(
        "You are not authorized to update this user account.",
        "UNAUTHORIZED_USER_UPDATE"
      );
    } catch (error) {
      next(error);
    }
  };
}

export function requireTeamMemberWhenTeamContextPresent() {
  return async (req, res, next) => {
    try {
      const context = await ensureRequestContext(req);

      if (!context.teamId || context.isSuperAdmin || context.membership) {
        return next();
      }

      throw new ForbiddenError(
        "You must be an active member of this team to access team-scoped data.",
        "ACTIVE_MEMBERSHIP_REQUIRED"
      );
    } catch (error) {
      next(error);
    }
  };
}

function allowsGlobalPermissionRead(permissionKey) {
  if (permissionKey === "permission.read") return true;
  return Array.isArray(permissionKey) && permissionKey.includes("permission.read");
}

export default requirePermission;
