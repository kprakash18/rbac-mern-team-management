import { resolvePermissions, can } from "./authorization.service.js";
import { BadRequestError } from "../../common/errors/index.js";

/**
 * GET /api/authorization/permissions?teamId=...
 */
export async function getMyPermissionsController(req, res, next) {
  try {
    const teamId = req.query.teamId || req.params.teamId || req.headers["x-team-id"];
    if (!teamId) {
      throw new BadRequestError("Query parameter 'teamId' is required.");
    }

    const permissions = await resolvePermissions(req.user.id, teamId);

    return res.status(200).json({
      success: true,
      data: { teamId, permissions },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/authorization/check
 */
export async function checkPermissionController(req, res, next) {
  try {
    const { teamId, permission, resource } = req.body;
    if (!teamId || !permission) {
      throw new BadRequestError("Fields 'teamId' and 'permission' are required.");
    }

    const allowed = await can(req.user.id, teamId, permission, resource);

    return res.status(200).json({
      success: true,
      data: { teamId, permission, resource: resource || null, allowed },
    });
  } catch (error) {
    next(error);
  }
}
