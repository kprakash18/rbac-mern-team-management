import Membership from "./membership.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import MembershipRole from "./membership-role.model.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../common/errors/index.js";
import { validateObjectId } from "../../common/utils/validators.js";
import { getPaginationParams } from "../../common/utils/pagination.js";

export async function getMembershipById({ teamId, membershipId }) {
  validateObjectId(teamId, "team ID");
  validateObjectId(membershipId, "membership ID");

  const membership = await Membership.findOne({
    _id: membershipId,
    teamId,
  }).populate("userId", "name email accountStatus");

  if (!membership || membership.status === "REMOVED") {
    throw new NotFoundError("Membership not found in this team.");
  }
  return membership;
}

export async function addMemberToTeam({ teamId, userId, addedBy }) {
  validateObjectId(teamId, "teamId");
  validateObjectId(userId, "userId");

  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }

  const user = await User.findById(userId);
  if (!user || user.accountStatus === "DISABLED") {
    throw new NotFoundError("User not found or account is disabled.");
  }

  const existing = await Membership.findOne({ userId, teamId });
  if (existing) {
    if (existing.status === "ACTIVE") {
      throw new ConflictError("User is already an active member of this team.", "MEMBERSHIP_EXISTS");
    }
    if (existing.status === "SUSPENDED") {
      throw new ConflictError("User membership is currently suspended. Please reactivate instead.", "MEMBERSHIP_SUSPENDED");
    }

    // Reactivate removed member
    existing.status = "ACTIVE";
    existing.joinedAt = new Date();
    existing.removedAt = null;
    await existing.save();
    return getMembershipById({ teamId, membershipId: existing._id });
  }

  const membership = await Membership.create({
    userId,
    teamId,
    status: "ACTIVE",
    joinedAt: new Date(),
  });

  return getMembershipById({ teamId, membershipId: membership._id });
}

export async function listTeamMembers({ teamId, status, page = 1, limit = 20 } = {}) {
  validateObjectId(teamId, "teamId");

  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }

  const query = { teamId, status: status || { $ne: "REMOVED" } };
  const { page: pageNum, limit: limitNum, skip, calculateTotalPages } = getPaginationParams({ page, limit });

  const [members, total] = await Promise.all([
    Membership.find(query)
      .populate("userId", "name email accountStatus")
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Membership.countDocuments(query),
  ]);

  return {
    members,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: calculateTotalPages(total),
  };
}

export async function suspendMembership({ teamId, membershipId, actorId }) {
  const membership = await getMembershipById({ teamId, membershipId });
  if (membership.status === "SUSPENDED") {
    throw new BadRequestError("Membership is already suspended.");
  }

  membership.status = "SUSPENDED";
  await membership.save();
  return getMembershipById({ teamId, membershipId: membership._id });
}

export async function reactivateMembership({ teamId, membershipId, actorId }) {
  const membership = await getMembershipById({ teamId, membershipId });
  if (membership.status === "ACTIVE") {
    throw new BadRequestError("Membership is already active.");
  }

  membership.status = "ACTIVE";
  await membership.save();
  return getMembershipById({ teamId, membershipId: membership._id });
}

export async function removeMemberFromTeam({ teamId, membershipId, actorId }) {
  const membership = await getMembershipById({ teamId, membershipId });

  membership.status = "REMOVED";
  membership.removedAt = new Date();
  await membership.save();

  await MembershipRole.updateMany(
    { membershipId: membership._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedBy: actorId } }
  );

  return {
    success: true,
    message: "Member removed from team successfully.",
  };
}

export const membershipService = {
  addMemberToTeam,
  listTeamMembers,
  getMembershipById,
  suspendMembership,
  reactivateMembership,
  removeMemberFromTeam,
};

export default membershipService;
