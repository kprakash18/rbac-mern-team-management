import Membership from "./membership.model.js";
import MembershipRole from "./membership-role.model.js";
import Role from "../roles/role.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../common/errors/index.js";
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
    throw new BadRequestError("Invalid teamId, userId, or roleId format.");
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

  // 3. Verify Membership exists & is ACTIVE
  const membership = await Membership.findOne({
    userId,
    teamId,
    status: "ACTIVE",
  });
  if (!membership) {
    throw new NotFoundError("Active team membership not found.");
  }

  // 4. Verify Role exists & is ACTIVE
  const role = await Role.findById(roleId);
  if (!role || role.status !== "ACTIVE") {
    throw new NotFoundError("Role not found or is not active.");
  }

   // 1. Check if an active unrevoked assignment already exists
  const existingAssignment = await MembershipRole.findOne({
    membershipId: membership._id,
    roleId: role._id,
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

  // Soft-revoke
  assignment.revokedAt = new Date();
  assignment.revokedBy = revokedBy;
  await assignment.save();

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
