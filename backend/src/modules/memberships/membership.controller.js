import { membershipService } from "./membership.service.js";

export async function addMember(req, res, next) {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const membership = await membershipService.addMemberToTeam({
      teamId,
      userId,
      addedBy: req.user.id,
    });

    return res.status(201).json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
}

export async function getTeamMembers(req, res, next) {
  try {
    const { teamId } = req.params;
    const { status, page, limit } = req.query;

    const result = await membershipService.listTeamMembers({
      teamId,
      status,
      page,
      limit,
    });

    return res.status(200).json({ success: true, data: result.members, pagination: result });
  } catch (error) {
    next(error);
  }
}

export async function getMemberById(req, res, next) {
  try {
    const { teamId, membershipId } = req.params;
    const membership = await membershipService.getMembershipById({ teamId, membershipId });

    return res.status(200).json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
}

export const membershipController = {
  addMember,
  getTeamMembers,
  getMemberById,
};

export default membershipController;
