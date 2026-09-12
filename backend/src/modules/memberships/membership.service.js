import mongoose from "mongoose";
import Membership from "./membership.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";
import RolePermission from "../roles/role-permission.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { emitToUser, emitToTeam, evictUserFromTeam } from "../../realtime/event-emitter.js";
import { createTargetedNotifications } from "../notifications/notification.service.js";
import { sendRoleAssignedEmail } from "../../common/email/email.service.js";
import { env } from "../../config/env.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../common/errors/index.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";
import { delCachePattern } from "../../config/redis.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

async function assertNotLastAdmin(teamId, membershipId) {
  const adminRoles = await Role.find({ name: { $in: ["Team Admin", "Super Admin"] }, status: "ACTIVE" }).select("_id");
  const adminRoleIds = adminRoles.map((r) => r._id);
  const isTargetAnAdmin = await MembershipRole.exists({
    membershipId,
    roleId: { $in: adminRoleIds },
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  if (!isTargetAnAdmin) return;

  const activeMembers = await Membership.find({ teamId, status: "ACTIVE" }).select("_id");
  const totalActiveAdmins = await MembershipRole.countDocuments({
    membershipId: { $in: activeMembers.map((m) => m._id) },
    roleId: { $in: adminRoleIds },
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  if (totalActiveAdmins <= 1) {
    throw new ConflictError("Cannot suspend or remove the last remaining administrator in this team.", "LAST_ADMIN_CANNOT_BE_REMOVED");
  }
}

async function resolveTargetRole(roleId, roleName) {
  if (isValidId(roleId)) return Role.findById(roleId);
  if (roleName) return Role.findOne({ name: roleName, status: "ACTIVE" });
  return Role.findOne({ name: "Developer", status: "ACTIVE" });
}

export async function addMemberToTeam({ teamId, userId, roleId, roleName, addedBy }) {
  if (!isValidId(teamId) || !isValidId(userId)) throw new BadRequestError("Invalid teamId or userId format.");

  const [team, user] = await Promise.all([
    Team.findById(teamId),
    User.findById(userId),
  ]);
  if (!team || team.status === "ARCHIVED") throw new NotFoundError("Team not found.");
  if (!user || user.accountStatus === "DISABLED") throw new NotFoundError("User not found or account is disabled.");

  const existingMembership = await Membership.findOne({ userId, teamId });
  if (existingMembership) {
    if (existingMembership.status === "ACTIVE") throw new ConflictError("User is already an active member of this team.", "MEMBERSHIP_EXISTS");
    if (existingMembership.status === "SUSPENDED") throw new ConflictError("User membership is currently suspended. Please reactivate instead.", "MEMBERSHIP_SUSPENDED");

    if (existingMembership.status === "REMOVED") {
      existingMembership.status = "ACTIVE";
      existingMembership.joinedAt = new Date();
      existingMembership.removedAt = null;
      await existingMembership.save();

      const targetRole = await resolveTargetRole(roleId, roleName);
      if (targetRole) {
        await MembershipRole.findOneAndUpdate(
          { membershipId: existingMembership._id, roleId: targetRole._id },
          { assignedBy: addedBy || userId, assignedAt: new Date(), revokedAt: null },
          { upsert: true }
        );
        await Membership.updateOne(
          { _id: existingMembership._id },
          { $addToSet: { roleIds: targetRole._id } }
        );
      }

      emitToUser(userId, "access:changed", { teamId, reason: "MEMBERSHIP_ADDED" });
      createTargetedNotifications({
        recipients: [userId],
        type: "GROUP_MEMBER_ADDED",
        teamId,
        resourceType: "TEAM",
        resourceId: team._id,
        metadata: { teamName: team.name, teamId: team._id, roleName: targetRole?.name || "Developer" },
      }).catch(() => {});

      sendRoleAssignedEmail({
        to: user.email,
        recipientName: user.name,
        teamName: team.name,
        roleName: targetRole?.name || "Developer",
        workspaceUrl: `${env.clientUrl || "http://localhost:5173"}/workspaces?teamId=${teamId}`,
      }).catch(() => {});

      await Promise.all([
        delCachePattern("teams:*"),
        delCachePattern("users:*"),
      ]);

      return getMembershipById({ teamId, membershipId: existingMembership._id });
    }
  }

  const newMembership = await Membership.create({ userId, teamId, status: "ACTIVE", joinedAt: new Date() });
  const targetRole = await resolveTargetRole(roleId, roleName);
  if (targetRole) {
    await MembershipRole.create({
      membershipId: newMembership._id,
      roleId: targetRole._id,
      assignedBy: addedBy || userId,
      assignedAt: new Date(),
    });
    await Membership.updateOne(
      { _id: newMembership._id },
      { $addToSet: { roleIds: targetRole._id } }
    );
  }

  emitToUser(userId, "access:changed", { teamId, reason: "MEMBERSHIP_ADDED" });
  createTargetedNotifications({
    recipients: [userId],
    type: "GROUP_MEMBER_ADDED",
    teamId,
    resourceType: "TEAM",
    resourceId: team._id,
    metadata: { teamName: team.name, teamId: team._id, roleName: targetRole?.name || "Developer" },
  }).catch(() => {});

  sendRoleAssignedEmail({
    to: user.email,
    recipientName: user.name,
    teamName: team.name,
    roleName: targetRole?.name || "Developer",
    workspaceUrl: `${env.clientUrl || "http://localhost:5173"}/workspaces?teamId=${teamId}`,
  }).catch(() => {});

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return getMembershipById({ teamId, membershipId: newMembership._id });
}

export async function listTeamMembers({ teamId, status, page = 1, limit = 20 } = {}) {
  if (!isValidId(teamId)) throw new BadRequestError("Invalid team ID format.");
  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") throw new NotFoundError("Team not found.");

  const query = { teamId, ...(status ? { status } : { status: { $ne: "REMOVED" } }) };
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({ page, limit, defaultLimit: 20 });

  const [rawMembers, total] = await Promise.all([
    Membership.find(query).populate("userId", "name email accountStatus").sort({ joinedAt: -1 }).skip(skip).limit(limitNum),
    Membership.countDocuments(query),
  ]);

  const memberRoles = await MembershipRole.find({ membershipId: { $in: rawMembers.map((m) => m._id) }, revokedAt: null })
    .populate("roleId", "name isSystemRole description")
    .lean();

  const allRoleIds = memberRoles.map((mr) => mr.roleId?._id).filter(Boolean);
  const rolePermissions = await RolePermission.find({ roleId: { $in: allRoleIds } })
    .populate("permissionId", "key description category resource action")
    .lean();

  const members = rawMembers.map((m) => {
    const mObj = m.toObject ? m.toObject() : { ...m };
    const roles = memberRoles.filter((mr) => String(mr.membershipId) === String(m._id)).map((mr) => mr.roleId).filter(Boolean);
    const memberRoleIds = roles.map((r) => String(r._id));
    const permissions = [...new Set(
      rolePermissions.filter((rp) => memberRoleIds.includes(String(rp.roleId))).map((rp) => rp.permissionId?.description || rp.permissionId?.key).filter(Boolean)
    )];

    return {
      ...mObj,
      roles,
      role: roles[0]?.name || "Developer",
      isTeamAdmin: roles.some((r) => r.name?.toLowerCase().includes("admin")),
      permissions,
    };
  });

  return { members, total, page: pageNum, limit: limitNum, totalPages: getTotalPages(total, limitNum) };
}

export async function getMembershipById({ teamId, membershipId }) {
  if (!isValidId(teamId) || !isValidId(membershipId)) throw new BadRequestError("Invalid ID format.");

  const membership = await Membership.findOne({ _id: membershipId, teamId }).populate("userId", "name email accountStatus");
  if (!membership) throw new NotFoundError("Membership not found in this team.");

  const memberRoles = await MembershipRole.find({ membershipId: membership._id, revokedAt: null })
    .populate("roleId", "name isSystemRole description")
    .lean();

  const roles = memberRoles.map((mr) => mr.roleId).filter(Boolean);
  const rolePermissions = await RolePermission.find({ roleId: { $in: roles.map((r) => r._id) } })
    .populate("permissionId", "key description category resource action")
    .lean();

  const permissions = [...new Set(rolePermissions.map((rp) => rp.permissionId?.description || rp.permissionId?.key).filter(Boolean))];

  return {
    ...membership.toObject(),
    roles,
    role: roles[0]?.name || "Developer",
    isTeamAdmin: roles.some((r) => r.name?.toLowerCase().includes("admin")),
    permissions,
  };
}

async function handleMembershipStatusChange({ teamId, membershipId, actorId, newStatus, eventName, checkAdmin = false }) {
  if (!isValidId(teamId) || !isValidId(membershipId)) throw new BadRequestError("Invalid ID format.");
  const membership = await Membership.findOne({ _id: membershipId, teamId });
  if (!membership || membership.status === "REMOVED") throw new NotFoundError("Membership not found.");
  if (membership.status === newStatus) throw new BadRequestError(`Membership is already ${newStatus.toLowerCase()}.`);

  if (checkAdmin) await assertNotLastAdmin(teamId, membership._id);

  membership.status = newStatus;
  if (newStatus === "REMOVED") membership.removedAt = new Date();
  await membership.save();

  if (newStatus === "REMOVED") {
    await MembershipRole.updateMany({ membershipId: membership._id, revokedAt: null }, { $set: { revokedAt: new Date(), revokedBy: actorId } });
  }

  const team = await Team.findById(teamId).select("name");
  const teamName = team?.name || "the team";

  emitToUser(membership.userId, "access:changed", { teamId, reason: `MEMBERSHIP_${newStatus}` });
  emitToTeam(teamId, eventName, { userId: membership.userId, membershipId: membership._id });
  if (newStatus === "REMOVED" || newStatus === "SUSPENDED") {
    evictUserFromTeam(membership.userId, teamId);
  }

  createTargetedNotifications({
    recipients: [membership.userId],
    actorId,
    type: "USER_STATUS_CHANGED",
    teamId,
    resourceType: "TEAM",
    resourceId: teamId,
    metadata: { status: newStatus, teamName, details: `Your team membership status has been updated to ${newStatus}.` },
  }).catch(() => {});

  logAuditEvent({
    actorId,
    action: `membership.${newStatus.toLowerCase()}`,
    targetType: "Membership",
    targetId: membership._id,
    teamId,
    result: "SUCCESS",
  });

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return newStatus === "REMOVED" ? { success: true, message: "Member removed from team successfully." } : getMembershipById({ teamId, membershipId: membership._id });
}

export async function suspendMembership({ teamId, membershipId, actorId }) {
  return handleMembershipStatusChange({ teamId, membershipId, actorId, newStatus: "SUSPENDED", eventName: "member:suspended", checkAdmin: true });
}

export async function reactivateMembership({ teamId, membershipId, actorId }) {
  return handleMembershipStatusChange({ teamId, membershipId, actorId, newStatus: "ACTIVE", eventName: "member:reactivated", checkAdmin: false });
}

export async function removeMemberFromTeam({ teamId, membershipId, actorId }) {
  return handleMembershipStatusChange({ teamId, membershipId, actorId, newStatus: "REMOVED", eventName: "member:removed", checkAdmin: true });
}

export const membershipService = {
  addMemberToTeam,
  listTeamMembers,
  getMembershipById,
  removeMemberFromTeam,
  reactivateMembership,
  suspendMembership,
};

export default membershipService;
