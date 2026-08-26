import { resolvePermissions, can , getAllUserPermissions} from "./authorization.service.js";
import { BadRequestError } from "../../common/errors/index.js";

/**
 * GET /api/authorization/permissions?teamId=...
 */
export async function getMyPermissionsController(req, res, next) {
  try {
    const teamId = req.query.teamId ;
    if (teamId) {
      const permissions = await resolvePermissions(req.user.id, teamId);
      return res.status(200).json({
        success: true,
        data: { teamId, permissions },
      });
    }
    const teams = await getAllUserPermissions(req.user.id);
    return res.status(200).json({
      success: true,
      data: {
        userId: req.user.id,
        teams,
      },
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
