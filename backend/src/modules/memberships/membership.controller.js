import { membershipService } from "./membership.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

export const addMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  const membership = await membershipService.addMemberToTeam({
    teamId,
    userId,
    addedBy: req.user.id,
  });
  res.status(201).json({ success: true, data: membership });
});

export const getTeamMembers = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { status, page, limit } = req.query;
  const result = await membershipService.listTeamMembers({ teamId, status, page, limit });
  res.status(200).json({ success: true, data: result.members, pagination: result });
});

export const getMemberById = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const membership = await membershipService.getMembershipById({ teamId, membershipId });
  res.status(200).json({ success: true, data: membership });
});

export const suspendMember = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const updated = await membershipService.suspendMembership({
    teamId,
    membershipId,
    actorId: req.user.id,
  });
  res.status(200).json({ success: true, data: updated });
});

export const reactivateMember = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const updated = await membershipService.reactivateMembership({
    teamId,
    membershipId,
    actorId: req.user.id,
  });
  res.status(200).json({ success: true, data: updated });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const result = await membershipService.removeMemberFromTeam({
    teamId,
    membershipId,
    actorId: req.user.id,
  });
  res.status(200).json(result);
});

export const membershipController = {
  addMember,
  getTeamMembers,
  getMemberById,
  removeMember,
  suspendMember,
  reactivateMember,
};

export default membershipController;
