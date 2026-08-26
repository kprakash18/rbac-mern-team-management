import Team from "./team.model.js";
import Membership from "../memberships/membership.model.js";
import { ConflictError, NotFoundError } from "../../common/errors/index.js";
import {
  validateObjectId,
  validateRequiredString,
  validateOptionalString,
} from "../../common/utils/validators.js";
import { getPaginationParams } from "../../common/utils/pagination.js";

export async function getTeamById(teamId) {
  validateObjectId(teamId, "team ID");
  const team = await Team.findById(teamId).populate("createdBy", "name email");
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }
  return team;
}

export async function createTeam({ name, description = "", createdBy }) {
  const normalizedName = validateRequiredString(name, "Team name");
  const normalizedDesc = validateOptionalString(description, "Description");
  validateObjectId(createdBy, "creator ID");

  if (await Team.exists({ name: normalizedName, status: { $ne: "ARCHIVED" } })) {
    throw new ConflictError("A team with this name already exists.", "TEAM_NAME_EXISTS");
  }

  const team = await Team.create({
    name: normalizedName,
    description: normalizedDesc,
    createdBy,
    status: "ACTIVE",
  });

  await Membership.create({
    userId: createdBy,
    teamId: team._id,
    status: "ACTIVE",
    joinedAt: new Date(),
  });

  return getTeamById(team._id);
}

export async function listTeams({ status, search, page = 1, limit = 20 } = {}) {
  const query = { status: status || { $ne: "ARCHIVED" } };
  if (search?.trim()) query.name = { $regex: search.trim(), $options: "i" };

  const { page: pageNum, limit: limitNum, skip, calculateTotalPages } = getPaginationParams({ page, limit });

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
    totalPages: calculateTotalPages(total),
  };
}

export async function updateTeam(teamId, { name, description }) {
  const team = await getTeamById(teamId);

  if (name !== undefined) {
    const normalizedName = validateRequiredString(name, "Team name");
    if (normalizedName !== team.name) {
      if (await Team.exists({ _id: { $ne: team._id }, name: normalizedName, status: { $ne: "ARCHIVED" } })) {
        throw new ConflictError("A team with this name already exists.", "TEAM_NAME_EXISTS");
      }
      team.name = normalizedName;
    }
  }

  if (description !== undefined) {
    team.description = validateOptionalString(description, "Description");
  }

  await team.save();
  return getTeamById(team._id);
}

export async function archiveTeam(teamId) {
  const team = await getTeamById(teamId);
  team.status = "ARCHIVED";
  await team.save();
  return { success: true, message: "Team archived successfully." };
}

export const teamService = {
  createTeam,
  listTeams,
  getTeamById,
  updateTeam,
  archiveTeam,
};

export default teamService;