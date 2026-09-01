import Team from "./team.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";

import { logAuditEvent } from "../audit/audit.service.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../common/errors/index.js";
import mongoose from "mongoose";

export async function createTeam({ name, description = "", createdBy }) {
  // validate the incoming inputs
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new BadRequestError("Team name is required");
  }
  // description validation
  if (typeof description !== "string") {
    throw new BadRequestError("Description must be string");
  }

  if (!mongoose.Types.ObjectId.isValid(createdBy)) {
    throw new BadRequestError("Invalid creator ID format");
  }

  const normalizedName = name.trim();
  // check if the team name already exist with the same name
  const existingTeam = await Team.findOne({
    name: normalizedName,
    status: { $ne: "ARCHIVED" },
  });

  if (existingTeam) {
    throw new ConflictError(
      "A team with this name already exists.",
      "TEAM_NAME_EXISTS"
    );
  }

  // create team
  const team = await Team.create({
    name: normalizedName,
    description: description?.trim() ?? "",
    createdBy,
    status: "ACTIVE",
  });

  // automatically add creator as the first active member
  const membership = await Membership.create({
    userId: createdBy,
    teamId: team._id,
    status: "ACTIVE",
    joinedAt: new Date(),
  });

  // automatically assign the Team Admin role to the creator
  const adminRole = await Role.findOne({ name: "Team Admin", isSystemRole: true });
  if (adminRole) {
    await MembershipRole.create({
      membershipId: membership._id,
      roleId: adminRole._id,
      assignedBy: createdBy,
      assignedAt: new Date(),
    });
  }

  logAuditEvent({
    actorId: createdBy,
    action: "team.created",
    targetType: "Team",
    targetId: team._id,
    teamId: team._id,
    result: "SUCCESS",
    metadata: { name: team.name },
  });

  return getTeamById(team._id);
}


export async function getUserTeams(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new BadRequestError("Invalid user ID format.");
  }

  const memberships = await Membership.find({
    userId,
    status: "ACTIVE",
  }).select("teamId");

  const teamIds = memberships.map((m) => m.teamId);

  const teams = await Team.find({
    _id: { $in: teamIds },
    status: { $ne: "ARCHIVED" },
  })
    .populate("createdBy", "name email")
    .sort({ name: 1 });

  return teams;
}

export async function listTeams({
  status,
  search,
  page = 1,
  limit = 20,
} = {}) {

  const query = {};
  if (status) {
    query.status = status;
  } else {
    query.status = { $ne: "ARCHIVED" };
  }
  if (search && typeof search === "string" && search.trim().length > 0) {
    query.name = { $regex: search.trim(), $options: "i" };
  }
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;
  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Team.countDocuments(query),
  ]);
  return {
    teams,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}
export async function getTeamById(teamId) {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid team ID format.");
  }
  const team = await Team.findById(teamId).populate("createdBy", "name email");
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }
  return team;
}
export async function updateTeam(teamId, { name, description }) {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid team ID format.");
  }
  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }
  if (name && typeof name === "string" && name.trim().length > 0) {
    const normalizedName = name.trim();
    if (normalizedName !== team.name) {

      const existingTeam = await Team.findOne({
        _id: {$ne: team._id},
        name : normalizedName,
        status: {$ne : "ARCHIVED"},
      });
      if(existingTeam){
        throw new ConflictError(
          "A team with this name already exists.",
          "TEAM_NAME_EXISTS"
        )
      }
      team.name = normalizedName;
    }
  }
  if (typeof description === "string") {
    team.description = description.trim();
  }
  await team.save();
  return getTeamById(team._id);
}


export async function archiveTeam(teamId) {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid team ID format.");
  }
  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }

  team.status = "ARCHIVED";
  await team.save();

  return {
    success: true,
    message: "Team archived successfully.",
  };
}

export const teamService = {
  createTeam,
  listTeams,
  getTeamById,
  updateTeam,
  archiveTeam,
};
export default teamService;