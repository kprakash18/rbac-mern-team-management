import { membershipService } from "./membership.service.js";

export async function addMember(req, res, next) {
  try {
    const { teamId } = req.params;
    const { userId, roleId, roleName } = req.body;

    const membership = await membershipService.addMemberToTeam({
      teamId,
      userId,
      roleId,
      roleName,
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

export async function suspendMember (req,res,next){
    try {
        const {teamId, membershipId} = req.params;
        const updated = await membershipService.suspendMembership({
            teamId,
            membershipId,
            actorId: req.user.id,
        })
        return res.status(200).json({success: true, data: updated});
    } catch (error) {
        next(error);
    }
}
export async function reactivateMember(req, res, next) {
  try {
    const { teamId, membershipId } = req.params;
    const updated = await membershipService.reactivateMembership({
      teamId,
      membershipId,
      actorId: req.user.id,
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
export async function removeMember(req, res, next) {
  try {
    const { teamId, membershipId } = req.params;
    const result = await membershipService.removeMemberFromTeam({
      teamId,
      membershipId,
      actorId: req.user.id,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}



export const membershipController = {
  addMember,
  getTeamMembers,
  getMemberById,
  removeMember,
  suspendMember,
  reactivateMember,
};

export default membershipController;
