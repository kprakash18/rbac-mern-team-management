import mongoose from "mongoose";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "./member-role.model.js";
import Role from "../roles/role.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from "../../common/errors/index.js";
import { isSuperAdmin } from "../authorization/authorization.service.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { emitToUser, emitToTeam } from "../../realtime/event-emitter.js";
import { createTargetedNotifications } from "../notifications/notification.service.js";
import { sendRoleAssignedEmail } from "../../common/email/email.service.js";
import { env } from "../../config/env.js";
import { delCachePattern } from "../../config/redis.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

export async function assignRoleToMember({ teamId, userId, roleId, expiresAt = null, assignedBy }) {
  if (!isValidId(teamId) || !isValidId(userId) || !isValidId(roleId)) throw new BadRequestError("Invalid ID format.");

  const [team, user, role, membership] = await Promise.all([
    Team.findById(teamId),
    User.findById(userId),
    Role.findById(roleId),
    Membership.findOne({ teamId, userId }),
  ]);

  if (!team) throw new NotFoundError("Team not found.");
  if (!user) throw new NotFoundError("User not found.");
  if (!role) throw new NotFoundError("Role not found.");
  if (!membership) throw new NotFoundError("User is not a member of this team.");

  if (["Super Admin", "Platform Super Admin"].includes(role.name)) {
    const isAssignerSuperAdmin = await isSuperAdmin(assignedBy);
    if (!isAssignerSuperAdmin) throw new ForbiddenError("Only an existing Super Admin can assign the Super Admin role.", "SUPER_ADMIN_REQUIRED");
  }

  const existingAssignment = await MembershipRole.findOne({ membershipId: membership._id, roleId, revokedAt: null });
  if (existingAssignment) throw new ConflictError("Role is already actively assigned to this member.", "ROLE_ALREADY_ASSIGNED");

  const assignment = await MembershipRole.create({
    membershipId: membership._id,
    roleId: role._id,
    assignedBy,
    assignedAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  await Membership.updateOne({ _id: membership._id }, { $addToSet: { roleIds: role._id } });

  emitToUser(userId, "access:changed", { teamId, reason: "ROLE_ASSIGNED", roleId: role._id });
  emitToUser(userId, "role:assigned", { teamId, role: { id: role._id, name: role.name } });
  emitToTeam(teamId, "member:role_assigned", { userId, roleId: role._id });

  createTargetedNotifications({
    recipients: [userId],
    actorId: assignedBy,
    type: "USER_ROLE_CHANGED",
    teamId,
    resourceType: "ROLE",
    resourceId: role._id,
    metadata: { roleId: role._id, roleName: role.name, expiresAt },
  }).catch(() => {});

  sendRoleAssignedEmail({
    to: user.email,
    recipientName: user.name,
    teamName: team.name,
    roleName: role.name,
    workspaceUrl: `${env.clientUrl || "http://localhost:5173"}/workspaces?teamId=${teamId}`,
  }).catch(() => {});

  logAuditEvent({
    actorId: assignedBy,
    action: "role.assigned",
    targetType: "MembershipRole",
    targetId: assignment._id,
    teamId,
    result: "SUCCESS",
    metadata: { userId, roleId, expiresAt },
  });

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return getAssignmentById(assignment._id);
}

export async function updateRoleAssignmentTtl({ teamId, userId, assignmentId, expiresAt }) {
  if (!isValidId(teamId) || !isValidId(userId) || !isValidId(assignmentId)) throw new BadRequestError("Invalid ID format.");

  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" });
  if (!membership) throw new NotFoundError("Active team membership not found.");

  const assignment = await MembershipRole.findOne({ _id: assignmentId, membershipId: membership._id, revokedAt: null });
  if (!assignment) throw new NotFoundError("Active role assignment not found.");

  assignment.expiresAt = expiresAt ? new Date(expiresAt) : null;
  await assignment.save();

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return getAssignmentById(assignment._id);
}

export async function revokeRoleAssignment({ teamId, userId, assignmentId, revokedBy }) {
  if (!isValidId(teamId) || !isValidId(userId) || !isValidId(assignmentId)) throw new BadRequestError("Invalid ID format.");

  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" });
  if (!membership) throw new NotFoundError("Active team membership not found.");

  const assignment = await MembershipRole.findOne({ _id: assignmentId, membershipId: membership._id, revokedAt: null });
  if (!assignment) throw new NotFoundError("Active role assignment not found.");

  const targetRole = await Role.findById(assignment.roleId);
  if (targetRole && ["Team Admin", "Super Admin"].includes(targetRole.name)) {
    const activeMembers = await Membership.find({ teamId, status: "ACTIVE" }).select("_id");
    const activeAdminCount = await MembershipRole.countDocuments({
      membershipId: { $in: activeMembers.map((m) => m._id) },
      roleId: targetRole._id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    if (activeAdminCount <= 1) {
      throw new ConflictError("Cannot revoke the role from the last remaining administrator in this team.", "LAST_ADMIN_CANNOT_BE_REMOVED");
    }
  }

  assignment.revokedAt = new Date();
  assignment.revokedBy = revokedBy;
  await assignment.save();

  await Membership.updateOne({ _id: membership._id }, { $pull: { roleIds: assignment.roleId } });

  emitToUser(userId, "access:changed", { teamId, reason: "ROLE_REVOKED", roleId: assignment.roleId });
  emitToUser(userId, "role:revoked", { teamId, assignmentId: assignment._id });
  emitToTeam(teamId, "member:role_revoked", { userId, assignmentId: assignment._id });

  createTargetedNotifications({
    recipients: [userId],
    actorId: revokedBy,
    type: "USER_ROLE_CHANGED",
    teamId,
    resourceType: "ROLE",
    resourceId: assignment.roleId,
    metadata: { roleId: assignment.roleId, roleName: targetRole?.name || "Role", details: `Your role assignment '${targetRole?.name || "Role"}' has been revoked.` },
  }).catch(() => {});

  logAuditEvent({
    actorId: revokedBy,
    action: "role.revoked",
    targetType: "MembershipRole",
    targetId: assignment._id,
    teamId,
    result: "SUCCESS",
    metadata: { userId, roleId: assignment.roleId },
  });

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return { success: true, message: "Role assignment revoked successfully." };
}

export async function listMemberRoles({ teamId, userId }) {
  if (!isValidId(teamId) || !isValidId(userId)) throw new BadRequestError("Invalid ID format.");

  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" });
  if (!membership) throw new NotFoundError("Active team membership not found.");

  const assignments = await MembershipRole.find({ membershipId: membership._id })
    .populate("roleId", "name description isSystemRole status")
    .populate("assignedBy", "name email")
    .populate("revokedBy", "name email")
    .sort({ createdAt: -1 });

  const now = new Date();
  return assignments.map((a) => ({
    ...a.toObject(),
    derivedState: a.revokedAt !== null ? "REVOKED" : a.expiresAt !== null && a.expiresAt <= now ? "EXPIRED" : "ACTIVE",
  }));
}

export async function getAssignmentById(assignmentId) {
  return MembershipRole.findById(assignmentId)
    .populate("roleId", "name description isSystemRole status")
    .populate("assignedBy", "name email");
}

export const membershipRoleService = {
  assignRoleToMember,
  updateRoleAssignmentTtl,
  revokeRoleAssignment,
  listMemberRoles,
  getAssignmentById,
};

export default membershipRoleService;
