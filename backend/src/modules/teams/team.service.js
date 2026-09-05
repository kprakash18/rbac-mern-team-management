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
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";
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
  }).select("_id teamId");

  const teamIds = memberships.map((m) => m.teamId);

  const teams = await Team.find({
    _id: { $in: teamIds },
    status: { $ne: "ARCHIVED" },
  })
    .populate("createdBy", "name email")
    .sort({ name: 1 })
    .lean();

  const membershipIds = memberships.map((m) => m._id);
  const memRoles = await MembershipRole.find({
    membershipId: { $in: membershipIds },
    revokedAt: null,
  })
    .populate("roleId", "name isSystemRole")
    .lean();

  return teams.map((team) => {
    const mem = memberships.find((m) => String(m.teamId) === String(team._id));
    const roles = mem
      ? memRoles
          .filter((mr) => String(mr.membershipId) === String(mem._id))
          .map((mr) => mr.roleId?.name)
          .filter(Boolean)
      : [];

    const primaryRole = roles[0] || "Developer";
    const isTeamAdmin = roles.some((r) => r.toLowerCase().includes("admin"));

    return {
      ...team,
      role: primaryRole,
      roles,
      isTeamAdmin,
    };
  });
}

export async function listTeams({
  status,
  search,
  page = 1,
  limit = 50,
} = {}) {

  const query = {};
  if (status && status !== 'all' && status !== 'ALL') {
    query.status = status.toUpperCase();
  }
  if (search && typeof search === "string" && search.trim().length > 0) {
    query.name = { $regex: search.trim(), $options: "i" };
  }
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });
  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Team.countDocuments(query),
  ]);

  // Enrich each team with active member count and team admins
  const teamIds = teams.map((t) => t._id);
  const activeMemberships = await Membership.find({
    teamId: { $in: teamIds },
    status: "ACTIVE",
  })
    .populate("userId", "name email")
    .lean();

  const membershipIds = activeMemberships.map((m) => m._id);
  const memberRoles = await MembershipRole.find({
    membershipId: { $in: membershipIds },
    revokedAt: null,
  })
    .populate("roleId", "name isSystemRole")
    .lean();

  const enrichedTeams = teams.map((team) => {
    const teamMems = activeMemberships.filter(
      (m) => String(m.teamId) === String(team._id)
    );
    const membersCount = teamMems.length;

    // Find admins for this team
    const adminUserNames = [];
    const memberList = [];

    teamMems.forEach((m) => {
      if (!m.userId) return;
      const rolesForMem = memberRoles
        .filter((mr) => String(mr.membershipId) === String(m._id))
        .map((mr) => mr.roleId?.name)
        .filter(Boolean);

      const isTeamAdmin = rolesForMem.some((r) =>
        r.toLowerCase().includes("admin")
      );
      if (isTeamAdmin && m.userId.name && !adminUserNames.includes(m.userId.name)) {
        adminUserNames.push(m.userId.name);
      }
      memberList.push({
        id: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        roles: rolesForMem,
        joinedAt: m.joinedAt,
      });
    });

    return {
      ...team,
      membersCount,
      admins: adminUserNames.length > 0 ? adminUserNames : (team.createdBy?.name ? [team.createdBy.name] : []),
      members: memberList,
    };
  });

  return {
    teams: enrichedTeams,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: getTotalPages(total, limitNum),
  };
}
export async function getTeamById(teamId) {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid team ID format.");
  }
  const team = await Team.findById(teamId).populate("createdBy", "name email");
  if (!team) {
    throw new NotFoundError("Team not found.");
  }
  return team;
}
export async function updateTeam(teamId, { name, description, status }) {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid team ID format.");
  }
  const team = await Team.findById(teamId);
  if (!team) {
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
  if (status && ["ACTIVE", "ARCHIVED", "INACTIVE"].includes(status)) {
    team.status = status;
  }
  await team.save();

  logAuditEvent({
    action: "team.updated",
    targetType: "Team",
    targetId: team._id,
    teamId: team._id,
    metadata: { name: team.name, description: team.description, status: team.status },
  });

  return getTeamById(team._id);
}


export async function archiveTeam(teamId, actorId = null) {
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid team ID format.");
  }
  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }

  team.status = "ARCHIVED";
  await team.save();

  logAuditEvent({
    actorId,
    action: "team.archived",
    targetType: "Team",
    targetId: team._id,
    teamId: team._id,
    metadata: { name: team.name },
  });

  return {
    success: true,
    message: "Team archived successfully.",
  };
}

export const teamService = {
  createTeam,
  getUserTeams,
  listTeams,
  getTeamById,
  updateTeam,
  archiveTeam,
};
export default teamService;