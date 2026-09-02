import Membership from "./membership.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Role from "../roles/role.model.js";

import { logAuditEvent } from "../audit/audit.service.js";
import { emitToUser, emitToTeam } from "../../realtime/event-emitter.js";
import { createNotification } from "../notifications/notification.service.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../common/errors/index.js";
import mongoose from "mongoose";

// Helper to assert that a target membership is not the last admin
async function assertNotLastAdmin(teamId, membershipId) {
  // 1a. Find admin roles ("Team Admin", "Super Admin")
  const adminRoles = await Role.find({
    name: { $in: ["Team Admin", "Super Admin"] },
    status: "ACTIVE",
  }).select("_id");
  const adminRoleIds = adminRoles.map((r) => r._id);

  // 1b. Check if this specific membership holds any active admin role
  const isTargetAnAdmin = await MembershipRole.findOne({
    membershipId,
    roleId: { $in: adminRoleIds },
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  // If the target member is not an admin, they can safely be suspended/removed
  if (!isTargetAnAdmin) return;

  // 1c. Find all active memberships in this team
  const activeMemberships = await Membership.find({
    teamId,
    status: "ACTIVE",
  }).select("_id");
  const activeMembershipIds = activeMemberships.map((m) => m._id);

  // 1d. Count total active admin assignments across the entire team
  const totalActiveAdmins = await MembershipRole.countDocuments({
    membershipId: { $in: activeMembershipIds },
    roleId: { $in: adminRoleIds },
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  // 1e. If 1 or fewer, block the action
  if (totalActiveAdmins <= 1) {
    throw new ConflictError(
      "Cannot suspend or remove the last remaining administrator in this team.",
      "LAST_ADMIN_CANNOT_BE_REMOVED"
    );
  }
}

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

export async function suspendMembership({ teamId, membershipId, actorId }) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(membershipId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }
  const membership = await Membership.findOne({ _id: membershipId, teamId });
  if (!membership || membership.status === "REMOVED") {
    throw new NotFoundError("Active or suspended membership not found.");
  }
  if (membership.status === "SUSPENDED") {
    throw new BadRequestError("Membership is already suspended.");
  }

  // Guard against locking out the team if this member is the last active admin
  await assertNotLastAdmin(teamId, membership._id);

  membership.status = "SUSPENDED";
  await membership.save();

  // Real-time Event Emissions & Notification
  emitToUser(membership.userId, "access:changed", {
    teamId,
    reason: "MEMBERSHIP_SUSPENDED",
  });
  emitToTeam(teamId, "member:suspended", {
    userId: membership.userId,
    membershipId: membership._id,
  });
  createNotification({
    recipientId: membership.userId,
    type: "TEAM_MEMBERSHIP",
    title: "Membership Suspended",
    message: "Your team membership has been suspended.",
    teamId,
  }).catch((err) => console.error("Failed to persist notification:", err));

  // Audit Logging
  logAuditEvent({
    actorId,
    action: "membership.suspended",
    targetType: "Membership",
    targetId: membership._id,
    teamId,
    result: "SUCCESS",
  });

  return getMembershipById({ teamId, membershipId: membership._id });
}

export async function reactivateMembership({ teamId, membershipId, actorId }) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(membershipId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }
  const membership = await Membership.findOne({ _id: membershipId, teamId });
  if (!membership || membership.status === "REMOVED") {
    throw new NotFoundError("Membership not found.");
  }
  if (membership.status === "ACTIVE") {
    throw new BadRequestError("Membership is already active.");
  }
  membership.status = "ACTIVE";
  await membership.save();

  // Real-time Event Emissions & Notification
  emitToUser(membership.userId, "access:changed", {
    teamId,
    reason: "MEMBERSHIP_ACTIVATED",
  });
  emitToTeam(teamId, "member:reactivated", {
    userId: membership.userId,
    membershipId: membership._id,
  });
  createNotification({
    recipientId: membership.userId,
    type: "TEAM_MEMBERSHIP",
    title: "Membership Reactivated",
    message: "Your team membership has been reactivated.",
    teamId,
  }).catch((err) => console.error("Failed to persist notification:", err));

  // Audit Logging
  logAuditEvent({
    actorId,
    action: "membership.reactivated",
    targetType: "Membership",
    targetId: membership._id,
    teamId,
    result: "SUCCESS",
  });

  return getMembershipById({ teamId, membershipId: membership._id });
}

export async function removeMemberFromTeam({ teamId, membershipId, actorId }) {
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(membershipId)
  ) {
    throw new BadRequestError("Invalid ID format.");
  }
  const membership = await Membership.findOne({ _id: membershipId, teamId });
  if (!membership || membership.status === "REMOVED") {
    throw new NotFoundError("Membership not found in this team.");
  }

  // Guard against locking out the team if this member is the last active admin
  await assertNotLastAdmin(teamId, membership._id);

  // 1. Mark membership as REMOVED
  membership.status = "REMOVED";
  membership.removedAt = new Date();
  await membership.save();

  // 2. Cascade soft-revoke any active roles for this membership
  await MembershipRole.updateMany(
    { membershipId: membership._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedBy: actorId } }
  );

  // 3. Real-time Event Emissions & Notification
  emitToUser(membership.userId, "access:changed", {
    teamId,
    reason: "MEMBERSHIP_REMOVED",
  });
  emitToTeam(teamId, "member:removed", {
    userId: membership.userId,
    membershipId: membership._id,
  });
  createNotification({
    recipientId: membership.userId,
    type: "TEAM_MEMBERSHIP",
    title: "Removed from Team",
    message: "You have been removed from the team.",
    teamId,
  }).catch((err) => console.error("Failed to persist notification:", err));

  // 4. Audit Logging
  logAuditEvent({
    actorId,
    action: "membership.removed",
    targetType: "Membership",
    targetId: membership._id,
    teamId,
    result: "SUCCESS",
  });

  return {
    success: true,
    message: "Member removed from team successfully.",
  };
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
