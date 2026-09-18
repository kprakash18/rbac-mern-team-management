import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/http/response.js";
import { resolvePermissions, can, getAllUserPermissions } from "./authorization.service.js";
import { BadRequestError } from "../../common/errors/index.js";

export const getMyPermissionsController = asyncHandler(async (req, res) => {
  const teamId = req.query.teamId || req.headers["x-team-id"] || req.params?.teamId;
  if (teamId) {
    const permissions = await resolvePermissions(req.user.id, teamId);
    return sendSuccess(res, {
      data: {
        teamId,
        permissions,
        effectivePermissions: permissions,
      },
    });
  }
  const teams = await getAllUserPermissions(req.user.id);
  sendSuccess(res, {
    data: {
      userId: req.user.id,
      teams,
    },
  });
});

export const checkPermissionController = asyncHandler(async (req, res) => {
  const { teamId, permission, resource } = req.body;
  if (!teamId || !permission) {
    throw new BadRequestError("Fields 'teamId' and 'permission' are required.");
  }

  const allowed = await can(req.user.id, teamId, permission, resource);
  sendSuccess(res, {
    data: { teamId, permission, resource: resource || null, allowed },
  });
});
