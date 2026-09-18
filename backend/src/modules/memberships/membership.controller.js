import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendCreated, sendSuccess } from "../../common/http/response.js";
import { membershipService } from "./membership.service.js";

export const addMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { userId, roleId, roleName } = req.body;
  const membership = await membershipService.addMemberToTeam({
    teamId,
    userId,
    roleId,
    roleName,
    addedBy: req.user.id,
  });
  sendCreated(res, { data: membership });
});

export const getTeamMembers = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { status, page, limit, q, search } = req.query;
  const result = await membershipService.listTeamMembers({
    teamId,
    status,
    page,
    limit,
    search: q || search,
  });
  sendSuccess(res, { data: result.members, pagination: result });
});

export const getMemberById = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const membership = await membershipService.getMembershipById({ teamId, membershipId });
  sendSuccess(res, { data: membership });
});

export const suspendMember = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const updated = await membershipService.suspendMembership({
    teamId,
    membershipId,
    actorId: req.user.id,
  });
  sendSuccess(res, { data: updated });
});

export const reactivateMember = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const updated = await membershipService.reactivateMembership({
    teamId,
    membershipId,
    actorId: req.user.id,
  });
  sendSuccess(res, { data: updated });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { teamId, membershipId } = req.params;
  const result = await membershipService.removeMemberFromTeam({
    teamId,
    membershipId,
    actorId: req.user.id,
  });
  sendSuccess(res, { message: result.message, data: result.data });
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
