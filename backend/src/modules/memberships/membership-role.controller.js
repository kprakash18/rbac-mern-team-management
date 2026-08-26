import { membershipRoleService } from "./membership-role.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

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
  res.status(201).json({ success: true, data: assignment });
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
  res.status(200).json({ success: true, data: updated });
});

export const revokeAssignment = asyncHandler(async (req, res) => {
  const { teamId, userId, assignmentId } = req.params;
  const result = await membershipRoleService.revokeRoleAssignment({
    teamId,
    userId,
    assignmentId,
    revokedBy: req.user.id,
  });
  res.status(200).json(result);
});

export const getMemberRoles = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  const roles = await membershipRoleService.listMemberRoles({ teamId, userId });
  res.status(200).json({ success: true, data: roles, count: roles.length });
});

export const membershipRoleController = {
  assignRole,
  updateAssignment,
  revokeAssignment,
  getMemberRoles,
};

export default membershipRoleController;
