import { membershipRoleService } from "./member-role.service.js";


export async function assignRole(req, res, next) {
  try {
    const { teamId, userId } = req.params;
    const { roleId, expiresAt } = req.body;

    const assignment = await membershipRoleService.assignRoleToMember({
      teamId,
      userId,
      roleId,
      expiresAt,
      assignedBy: req.user.id,
    });

    return res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function updateAssignment(req, res, next) {
  try {
    const { teamId, userId, assignmentId } = req.params;
    const { expiresAt } = req.body;

    const updated = await membershipRoleService.updateRoleAssignmentTtl({
      teamId,
      userId,
      assignmentId,
      expiresAt,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function revokeAssignment(req, res, next) {
  try {
    const { teamId, userId, assignmentId } = req.params;

    const result = await membershipRoleService.revokeRoleAssignment({
      teamId,
      userId,
      assignmentId,
      revokedBy: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMemberRoles(req, res, next) {
  try {
    const { teamId, userId } = req.params;
    const roles = await membershipRoleService.listMemberRoles({ teamId, userId });

    return res.status(200).json({ success: true, data: roles, count: roles.length });
  } catch (error) {
    next(error);
  }
}

export const membershipRoleController = {
  assignRole,
  updateAssignment,
  revokeAssignment,
  getMemberRoles,
};

export default membershipRoleController;
