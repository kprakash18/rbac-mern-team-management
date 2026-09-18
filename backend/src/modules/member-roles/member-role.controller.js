import { membershipRoleService } from "./member-role.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendCreated, sendSuccess } from "../../common/http/response.js";

export const assignRole = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  const { roleId, expiresAt } = req.body;

  const assignment = await membershipRoleService.assignRoleToMember({
    teamId,
    userId,
    roleId,
    expiresAt,
    assignedBy: req.user.id,
  });

  sendCreated(res, { data: assignment });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const { teamId, userId, assignmentId } = req.params;
  const { expiresAt } = req.body;

  const updated = await membershipRoleService.updateRoleAssignmentTtl({
    teamId,
    userId,
    assignmentId,
    expiresAt,
  });

  sendSuccess(res, { data: updated });
});

export const revokeAssignment = asyncHandler(async (req, res) => {
  const { teamId, userId, assignmentId } = req.params;

  const result = await membershipRoleService.revokeRoleAssignment({
    teamId,
    userId,
    assignmentId,
    revokedBy: req.user.id,
  });

  sendSuccess(res, { message: result.message, data: result.data });
});

export const getMemberRoles = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  const roles = await membershipRoleService.listMemberRoles({ teamId, userId });

  sendSuccess(res, { data: roles, extra: { count: roles.length } });
});

export const membershipRoleController = {
  assignRole,
  updateAssignment,
  revokeAssignment,
  getMemberRoles,
};

export default membershipRoleController;
