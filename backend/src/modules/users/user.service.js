import mongoose from "mongoose";
import User from "./user.model.js";
import Team from "../teams/team.model.js";
import Role from "../roles/role.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import { enrichUsersWithWorkspaces } from "./user.lookup.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/index.js";
import { isSuperAdmin } from "../authorization/authorization.service.js";
import { logAuditEvent } from "../audit/audit.service.js";

export async function searchUsers({ query = "", page = 1, limit = 50, status } = {}) {
  const filter = {};
  if (status) {
    filter.accountStatus = status.toUpperCase();
  }

  if (query && typeof query === "string" && query.trim().length > 0) {
    const trimmed = query.trim();
    filter.$or = [
      { name: { $regex: trimmed, $options: "i" } },
      { email: { $regex: trimmed, $options: "i" } },
    ];
  }

  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });

  const [rawUsers, total] = await Promise.all([
    User.find(filter)
      .select("name email accountStatus mustChangePassword createdAt avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Enrich users with workspaces and roles via lookup utility
  const users = await enrichUsersWithWorkspaces(rawUsers);

  return {
    users,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: getTotalPages(total, limitNum),
  };
}

export async function updateUser(userId, data = {}, actorId = null) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new BadRequestError("Invalid user ID format.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  const isActorSuperAdmin = actorId ? await isSuperAdmin(actorId) : false;

  // 1. Update basic fields if provided
  if (data.name && typeof data.name === "string") {
    user.name = data.name.trim();
  }

  if (data.accountStatus || data.status || data.statusType) {
    const rawStatus = (data.accountStatus || data.status || data.statusType).toUpperCase();
    if (["ACTIVE", "SUSPENDED", "DISABLED", "INVITED"].includes(rawStatus)) {
      user.accountStatus = rawStatus;
    }
  }

  if (typeof data.mustChangePassword === "boolean") {
    user.mustChangePassword = data.mustChangePassword;
  }

  if (data.lastLogoutAt) {
    user.lastLogoutAt = new Date(data.lastLogoutAt);
  }

  await user.save();

  // 2. Update Workspaces / Roles if provided
  if (Array.isArray(data.workspaces)) {
    for (const ws of data.workspaces) {
      if (!ws.name && !ws.id && !ws.teamId) continue;

      const teamQuery = ws.id || ws.teamId
        ? { _id: ws.id || ws.teamId }
        : { name: ws.name };

      const team = await Team.findOne(teamQuery);
      if (!team) continue;

      // Find or create Membership
      let membership = await Membership.findOne({ userId: user._id, teamId: team._id });
      if (!membership) {
        membership = await Membership.create({
          userId: user._id,
          teamId: team._id,
          status: "ACTIVE",
          joinedAt: new Date(),
        });
      } else if (membership.status !== "ACTIVE") {
        membership.status = "ACTIVE";
        membership.removedAt = null;
        await membership.save();
      }

      // Determine Target Role
      const targetRoleName = ws.isTeamAdmin ? "Team Admin" : (ws.role || "Developer");

      // Security Guardrail: Only existing Super Admin can assign Super Admin role
      if (targetRoleName === "Super Admin" || targetRoleName === "Platform Super Admin") {
        if (!isActorSuperAdmin) {
          throw new ForbiddenError(
            "Only an existing Super Admin can assign the Super Admin role.",
            "SUPER_ADMIN_REQUIRED"
          );
        }
      }

      const targetRole = await Role.findOne({ name: targetRoleName, status: "ACTIVE" });

      if (targetRole) {
        // Revoke any previous active roles on this membership
        await MembershipRole.updateMany(
          { membershipId: membership._id, revokedAt: null },
          { $set: { revokedAt: new Date(), revokedBy: actorId } }
        );

        // Assign the new role
        await MembershipRole.create({
          membershipId: membership._id,
          roleId: targetRole._id,
          assignedBy: actorId || user._id,
          assignedAt: new Date(),
        });
      }
    }
  }

  // Return enriched user
  const [enriched] = await enrichUsersWithWorkspaces([user.toObject()]);

  logAuditEvent({
    actorId,
    action: "user.updated",
    targetType: "User",
    targetId: user._id,
    metadata: {
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
      updates: data,
    },
  });

  return enriched;
}

export const userService = { searchUsers, updateUser };
export default userService;
