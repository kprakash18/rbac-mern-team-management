import { asyncHandler } from "../../common/utils/async-handler.js";
import { resolvePermissions, can, getAllUserPermissions } from "./authorization.service.js";
import { BadRequestError } from "../../common/errors/index.js";

export const getMyPermissionsController = asyncHandler(async (req, res) => {
  const teamId = req.query.teamId || req.headers["x-team-id"] || req.params?.teamId;
  if (teamId) {
    const permissions = await resolvePermissions(req.user.id, teamId);
    return res.status(200).json({
      success: true,
      data: {
        teamId,
        permissions,
        effectivePermissions: permissions,
      },
    });
  }
  const teams = await getAllUserPermissions(req.user.id);
  res.status(200).json({
    success: true,
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
  res.status(200).json({
    success: true,
    data: { teamId, permission, resource: resource || null, allowed },
  });
});
