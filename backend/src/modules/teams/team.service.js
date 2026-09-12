import mongoose from "mongoose";
import Team from "./team.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";
import AccessGrant from "../access/access-grant.model.js";
import Task from "../tasks/task.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { resolvePermissions, isSuperAdmin } from "../authorization/authorization.service.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../common/errors/index.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";
import { getCache, setCache, delCachePattern } from "../../config/redis.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

export async function createTeam({ name, description = "", createdBy }) {
  if (!name || typeof name !== "string" || !name.trim()) throw new BadRequestError("Team name is required");
  if (typeof description !== "string") throw new BadRequestError("Description must be string");
  if (!isValidId(createdBy)) throw new BadRequestError("Invalid creator ID format");

  const normalizedName = name.trim();
  const existingTeam = await Team.findOne({ name: normalizedName, status: { $ne: "ARCHIVED" } });
  if (existingTeam) throw new ConflictError("A team with this name already exists.", "TEAM_NAME_EXISTS");

  const team = await Team.create({
    name: normalizedName,
    description: description.trim(),
    createdBy,
    status: "ACTIVE",
  });

  const membership = await Membership.create({ userId: createdBy, teamId: team._id, status: "ACTIVE", joinedAt: new Date() });
  const adminRole = await Role.findOne({ name: "Team Admin", isSystemRole: true });
  if (adminRole) {
    await MembershipRole.create({ membershipId: membership._id, roleId: adminRole._id, assignedBy: createdBy, assignedAt: new Date() });
    membership.roleIds = [adminRole._id];
    await membership.save();
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

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return getTeamById(team._id);
}

export async function getUserTeams(userId) {
  if (!isValidId(userId)) throw new BadRequestError("Invalid user ID format.");

  const cacheKey = `teams:user:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const memberships = await Membership.find({ userId, status: "ACTIVE" }).select("_id teamId");
  const teams = await Team.find({ _id: { $in: memberships.map((m) => m.teamId) }, status: { $ne: "ARCHIVED" } })
    .populate("createdBy", "name email")
    .sort({ name: 1 })
    .lean();

  const memRoles = await MembershipRole.find({ membershipId: { $in: memberships.map((m) => m._id) }, revokedAt: null })
    .populate("roleId", "name isSystemRole")
    .lean();

  const result = teams.map((team) => {
    const mem = memberships.find((m) => String(m.teamId) === String(team._id));
    const roles = mem ? memRoles.filter((mr) => String(mr.membershipId) === String(mem._id)).map((mr) => mr.roleId?.name).filter(Boolean) : [];
    return {
      ...team,
      role: roles[0] || "Developer",
      roles,
      isTeamAdmin: roles.some((r) => r.toLowerCase().includes("admin")),
    };
  });

  await setCache(cacheKey, result, 60);
  return result;
}

export async function listTeams({ status, search, page = 1, limit = 50 } = {}) {
  const cacheKey = `teams:list:${status || "default"}:${search || ""}:${page}:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const query = {};
  if (status && !["all", "ALL"].includes(status)) {
    query.status = status.toUpperCase();
  } else if (!status) {
    query.status = { $ne: "ARCHIVED" };
  }
  if (search?.trim()) query.name = { $regex: search.trim(), $options: "i" };

  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });
  const [teams, total] = await Promise.all([
    Team.find(query).populate("createdBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Team.countDocuments(query),
  ]);

  const teamIds = teams.map((t) => t._id);
  const activeMemberships = await Membership.find({ teamId: { $in: teamIds }, status: "ACTIVE" }).populate("userId", "name email").lean();
  const memberRoles = await MembershipRole.find({ membershipId: { $in: activeMemberships.map((m) => m._id) }, revokedAt: null })
    .populate("roleId", "name isSystemRole")
    .lean();

  const enrichedTeams = teams.map((team) => {
    const teamMems = activeMemberships.filter((m) => String(m.teamId) === String(team._id));
    const adminUserNames = [];
    const memberList = [];

    teamMems.forEach((m) => {
      if (!m.userId) return;
      const rolesForMem = memberRoles.filter((mr) => String(mr.membershipId) === String(m._id)).map((mr) => mr.roleId?.name).filter(Boolean);
      if (rolesForMem.some((r) => r.toLowerCase().includes("admin")) && m.userId.name && !adminUserNames.includes(m.userId.name)) {
        adminUserNames.push(m.userId.name);
      }
      memberList.push({ id: m.userId._id, membershipId: m._id, name: m.userId.name, email: m.userId.email, roles: rolesForMem, joinedAt: m.joinedAt });
    });

    return {
      ...team,
      membersCount: teamMems.length,
      admins: adminUserNames.length > 0 ? adminUserNames : (team.createdBy?.name ? [team.createdBy.name] : []),
      members: memberList,
    };
  });

  const result = { teams: enrichedTeams, total, page: pageNum, limit: limitNum, totalPages: getTotalPages(total, limitNum) };
  await setCache(cacheKey, result, 60);
  return result;
}

export async function getTeamById(teamId) {
  if (!isValidId(teamId)) throw new BadRequestError("Invalid team ID format.");
  const team = await Team.findById(teamId).populate("createdBy", "name email");
  if (!team) throw new NotFoundError("Team not found.");
  return team;
}

export async function updateTeam(teamId, { name, description, status }) {
  if (!isValidId(teamId)) throw new BadRequestError("Invalid team ID format.");
  const team = await Team.findById(teamId);
  if (!team) throw new NotFoundError("Team not found.");

  if (name && typeof name === "string" && name.trim()) {
    const normalizedName = name.trim();
    if (normalizedName !== team.name) {
      const existingTeam = await Team.findOne({ _id: { $ne: team._id }, name: normalizedName, status: { $ne: "ARCHIVED" } });
      if (existingTeam) throw new ConflictError("A team with this name already exists.", "TEAM_NAME_EXISTS");
      team.name = normalizedName;
    }
  }
  if (typeof description === "string") team.description = description.trim();
  if (status && ["ACTIVE", "ARCHIVED", "INACTIVE"].includes(status)) team.status = status;
  await team.save();

  logAuditEvent({
    action: "team.updated",
    targetType: "Team",
    targetId: team._id,
    teamId: team._id,
    metadata: { name: team.name, description: team.description, status: team.status },
  });

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return getTeamById(team._id);
}

export async function archiveTeam(teamId, actorId = null) {
  if (!isValidId(teamId)) throw new BadRequestError("Invalid team ID format.");
  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") throw new NotFoundError("Team not found.");

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

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return { success: true, message: "Team archived successfully." };
}

export async function getWorkspaceBootstrap({ teamId, userId, actor }) {
  if (!isValidId(teamId) || !isValidId(userId)) throw new BadRequestError("Invalid team ID or user ID format.");

  const cacheKey = `teams:bootstrap:${teamId}:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") throw new NotFoundError("Team workspace not found.");

  const superAdmin = actor?.isSuperAdmin ?? (await isSuperAdmin(userId));
  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" }).populate("roleIds", "name description permissions isSystemRole");
  if (!membership && !superAdmin) throw new NotFoundError("Active team membership not found for this workspace.");

  const [permissions, activeGrants, memberCount, activeTaskCount] = await Promise.all([
    resolvePermissions(userId, teamId),
    AccessGrant.find({ userId, teamId, status: "ACTIVE", $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }),
    Membership.countDocuments({ teamId, status: "ACTIVE" }),
    Task.countDocuments({ teamId, status: { $ne: "DONE" } }),
  ]);

  const result = {
    team: { id: team._id, name: team.name, description: team.description, status: team.status, createdAt: team.createdAt },
    membership: membership ? { id: membership._id, status: membership.status, joinedAt: membership.joinedAt, roles: membership.roleIds || [] } : null,
    isSuperAdmin: superAdmin,
    permissions: superAdmin ? ["*"] : permissions,
    activeGrants,
    stats: { memberCount, activeTaskCount },
  };

  await setCache(cacheKey, result, 60);
  return result;
}

export const teamService = {
  createTeam,
  getUserTeams,
  listTeams,
  getTeamById,
  updateTeam,
  archiveTeam,
  getWorkspaceBootstrap,
};

export default teamService;
