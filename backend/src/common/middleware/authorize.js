import { can, isSuperAdmin } from "../../modules/authorization/authorization.service.js";
import { ForbiddenError, BadRequestError } from "../errors/index.js";

/**
 * Express middleware to enforce permissions on protected routes.
 */
export function requirePermission(permissionKey, getResourceId = null) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const teamId =
        req.params?.teamId ||
        req.query?.teamId ||
        req.body?.teamId ||
        req.headers["x-team-id"];

      // 1. Dynamic Super Admin check: Platform administrators have unrestricted global access
      const userIsSuperAdmin = req.user?.isSuperAdmin ?? (await isSuperAdmin(userId));
      if (userIsSuperAdmin) {
        req.authContext = { teamId: teamId || null, permissionKey, resource: null };
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

      const allowed = await can(userId, teamId, permissionKey, resource);

      if (!allowed) {
        throw new ForbiddenError(
          `You do not have permission ('${permissionKey}') to perform this action in this team context.`,
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

export default requirePermission;
