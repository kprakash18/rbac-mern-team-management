import Membership from "../memberships/membership.model.js";
import MembershipRole from "./member-role.model.js";
import Role from "../roles/role.model.js";

import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../common/errors/index.js";
import { isSuperAdmin } from "../authorization/authorization.service.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { emitToUser, emitToTeam } from "../../realtime/event-emitter.js";
import { createNotification, createTargetedNotifications } from "../notifications/notification.service.js";
import { sendRoleAssignedEmail } from "../../common/email/email.service.js";
import { env } from "../../config/env.js";
import mongoose from "mongoose";


export async function assignRoleToMember({
  teamId,
  userId,
  roleId,
  expiresAt = null,
  assignedBy,
}) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(roleId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }

  // 1. Verify existence of Team, User, Role, Membership
  const [team, user, role, membership] = await Promise.all([
    Team.findById(teamId),
    User.findById(userId),
    Role.findById(roleId),
    Membership.findOne({ teamId, userId }),
  ]);

  if (!team) throw new NotFoundError("Team not found.");
  if (!user) throw new NotFoundError("User not found.");
  if (!role) throw new NotFoundError("Role not found.");
  if (!membership) {
    throw new NotFoundError("User is not a member of this team.");
  }

  // Security Guardrail: Only existing Super Admin can assign Super Admin role
  if (role.name === "Super Admin" || role.name === "Platform Super Admin") {
    const isAssignerSuperAdmin = await isSuperAdmin(assignedBy);
    if (!isAssignerSuperAdmin) {
      throw new ForbiddenError(
        "Only an existing Super Admin can assign the Super Admin role.",
        "SUPER_ADMIN_REQUIRED"
      );
    }
  }

  // Check if role is already assigned and active
  const existingAssignment = await MembershipRole.findOne({
    membershipId: membership._id,
    roleId,
    revokedAt: null,
  });

  if (existingAssignment) {
    throw new ConflictError(
      "Role is already actively assigned to this member.",
      "ROLE_ALREADY_ASSIGNED"
    );
  }

  // 2. Create new MembershipRole document
  const assignment = await MembershipRole.create({
    membershipId: membership._id,
    roleId: role._id,
    assignedBy,
    assignedAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  // Real-time Event Emissions & Persistent Notification
  emitToUser(userId, "access:changed", {
    teamId,
    reason: "ROLE_ASSIGNED",
    roleId: role._id,
  });
  emitToUser(userId, "role:assigned", {
    teamId,
    role: { id: role._id, name: role.name },
  });
  emitToTeam(teamId, "member:role_assigned", {
    userId,
    roleId: role._id,
  });
  createTargetedNotifications({
    recipients: [userId],
    actorId: assignedBy,
    type: "USER_ROLE_CHANGED",
    teamId,
    resourceType: "ROLE",
    resourceId: role._id,
    metadata: { roleId: role._id, roleName: role.name, expiresAt },
  }).catch((err) => console.error("Failed to persist notification:", err));

  // Dispatch Email Notification to user
  const workspaceUrl = `${env.clientUrl || "http://localhost:5173"}/workspaces?teamId=${teamId}`;

  sendRoleAssignedEmail({
    to: user.email,
    recipientName: user.name,
    teamName: team.name,
    roleName: role.name,
    workspaceUrl,
  }).catch((err) => console.error("Role assignment email dispatch failed:", err));

  // Audit Logging
  logAuditEvent({
    actorId: assignedBy,
    action: "role.assigned",
    targetType: "MembershipRole",
    targetId: assignment._id,
    teamId,
    result: "SUCCESS",
    metadata: {
      userId,
      roleId,
      expiresAt,
    },
  });

  return getAssignmentById(assignment._id);


}

export async function updateRoleAssignmentTtl({
  teamId,
  userId,
  assignmentId,
  expiresAt,
}) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(assignmentId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }

  const membership = await Membership.findOne({
    userId,
    teamId,
    status: "ACTIVE",
  });
  if (!membership) {
    throw new NotFoundError("Active team membership not found.");
  }

  const assignment = await MembershipRole.findOne({
    _id: assignmentId,
    membershipId: membership._id,
    revokedAt: null,
  });

  if (!assignment) {
    throw new NotFoundError("Active role assignment not found.");
  }

  assignment.expiresAt = expiresAt ? new Date(expiresAt) : null;
  await assignment.save();

  return getAssignmentById(assignment._id);
}

export async function revokeRoleAssignment({
  teamId,
  userId,
  assignmentId,
  revokedBy,
}) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(assignmentId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }

  const membership = await Membership.findOne({
    userId,
    teamId,
    status: "ACTIVE",
  });
  if (!membership) {
    throw new NotFoundError("Active team membership not found.");
  }

  // Find active assignment
  const assignment = await MembershipRole.findOne({
    _id: assignmentId,
    membershipId: membership._id,
    revokedAt: null,
  });

  if (!assignment) {
    throw new NotFoundError("Active role assignment not found.");
  }

  // TODO 1: Fetch the Role document associated with assignment.roleId to inspect its name.
  const targetRole = await Role.findById(assignment.roleId);

  // TODO 2: Check if targetRole.name is "Team Admin" or "Super Admin"
  if (targetRole && (targetRole.name === "Team Admin" || targetRole.name === "Super Admin")) {
    // TODO 2a: Find all active membership IDs for this team
    const activeMemberships = await Membership.find({
      teamId,
      status: "ACTIVE",
    }).select("_id");
    
    const activeMembershipIds = activeMemberships.map((m) => m._id);

    // TODO 2b: Count how many active, unexpired MembershipRoles exist for this roleId across those memberships
    const activeAdminCount = await MembershipRole.countDocuments({
      membershipId: { $in: activeMembershipIds },
      roleId: targetRole._id,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    // TODO 2c: If activeAdminCount <= 1, prevent the lockout
    if (activeAdminCount <= 1) {
      throw new ConflictError(
        "Cannot revoke the role from the last remaining administrator in this team.",
        "LAST_ADMIN_CANNOT_BE_REMOVED"
      );
    }
  }

  // Soft-revoke
  assignment.revokedAt = new Date();
  assignment.revokedBy = revokedBy;
  await assignment.save();

  // Real-time Event Emissions & Persistent Notification
  emitToUser(userId, "access:changed", {
    teamId,
    reason: "ROLE_REVOKED",
    roleId: assignment.roleId,
  });
  emitToUser(userId, "role:revoked", {
    teamId,
    assignmentId: assignment._id,
  });
  emitToTeam(teamId, "member:role_revoked", {
    userId,
    assignmentId: assignment._id,
  });
  createTargetedNotifications({
    recipients: [userId],
    actorId: revokedBy,
    type: "USER_ROLE_CHANGED",
    teamId,
    resourceType: "ROLE",
    resourceId: assignment.roleId,
    metadata: {
      roleId: assignment.roleId,
      roleName: targetRole?.name || "Role",
      details: `Your role assignment '${targetRole?.name || "Role"}' has been revoked.`,
    },
  }).catch((err) => console.error("Failed to persist notification:", err));

  // Audit Logging
  logAuditEvent({
    actorId: revokedBy,
    action: "role.revoked",
    targetType: "MembershipRole",
    targetId: assignment._id,
    teamId,
    result: "SUCCESS",
    metadata: {
      userId,
      roleId: assignment.roleId,
    },
  });

  return {
    success: true,
    message: "Role assignment revoked successfully.",
  };

}

export async function listMemberRoles({ teamId, userId }) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }

  const membership = await Membership.findOne({
    userId,
    teamId,
    status: "ACTIVE",
  });
  if (!membership) {
    throw new NotFoundError("Active team membership not found.");
  }

  const assignments = await MembershipRole.find({
    membershipId: membership._id,
  })
    .populate("roleId", "name description isSystemRole status")
    .populate("assignedBy", "name email")
    .populate("revokedBy", "name email")
    .sort({ createdAt: -1 });

  const now = new Date();
  return assignments.map((a) => {
    let derivedState = "ACTIVE";
    if (a.revokedAt !== null) {
      derivedState = "REVOKED";
    } else if (a.expiresAt !== null && a.expiresAt <= now) {
      derivedState = "EXPIRED";
    }

    return {
      ...a.toObject(),
      derivedState,
    };
  });
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