import Membership from "./membership.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../common/errors/index.js";
import mongoose from "mongoose";

export async function addMemberToTeam({ teamId, userId, addedBy }) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    throw new BadRequestError("Invalid teamId or userId format.");
  }

  // 1. Verify Team exists & is active
  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }

  // 2. Verify User exists & is not disabled
  const user = await User.findById(userId);
  if (!user || user.accountStatus === "DISABLED") {
    throw new NotFoundError("User not found or account is disabled.");
  }

  // 3. Check for existing membership record
  const existingMembership = await Membership.findOne({ userId, teamId });

  if (existingMembership) {
    if (existingMembership.status === "ACTIVE") {
      throw new ConflictError(
        "User is already an active member of this team.",
        "MEMBERSHIP_EXISTS"
      );
    }
    if (existingMembership.status === "SUSPENDED") {
      throw new ConflictError(
        "User membership is currently suspended. Please reactivate instead.",
        "MEMBERSHIP_SUSPENDED"
      );
    }

        if (existingMembership.status === "REMOVED") {
            existingMembership.status = "ACTIVE";
            existingMembership.joinedAt = new Date();
            existingMembership.removedAt = null;
            await existingMembership.save();

            return getMembershipById({
                teamId,
                membershipId: existingMembership._id,
      });
    }

  }

  // 4. Create brand new Membership document
  const newMembership = await Membership.create({
    userId,
    teamId,
    status: "ACTIVE",
    joinedAt: new Date(),
  });

  return getMembershipById({ teamId, membershipId: newMembership._id });
}

export async function listTeamMembers({
  teamId,
  status,
  page = 1,
  limit = 20,
} = {}) {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid teamId format.");
  }

  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }

  const query = { teamId };
  if (status) {
    query.status = status;
  } else {
    query.status = { $ne: "REMOVED" };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

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
    totalPages: Math.ceil(total / limitNum),
  };
}

export async function getMembershipById({ teamId, membershipId }) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(membershipId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }

  const membership = await Membership.findOne({
    _id: membershipId,
    teamId,
  }).populate("userId", "name email accountStatus");

  if (!membership) {
    throw new NotFoundError("Membership not found in this team.");
  }

  return membership;
}

export const membershipService = {
  addMemberToTeam,
  listTeamMembers,
  getMembershipById,
};

export default membershipService;
