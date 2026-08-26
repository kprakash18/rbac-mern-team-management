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
import { validateObjectId } from "../../common/utils/validators.js";

/**
 * Finds an active team membership or throws NotFoundError
 */
async function getActiveMembership({ userId, teamId }) {
  validateObjectId(teamId, "teamId");
  validateObjectId(userId, "userId");

  const membership = await Membership.findOne({ userId, teamId, status: "ACTIVE" });
  if (!membership) {
    throw new NotFoundError("Active team membership not found.");
  }
  return membership;
}

/**
 * Finds an active unrevoked role assignment or throws NotFoundError
 */
async function getActiveAssignment({ assignmentId, membershipId }) {
  validateObjectId(assignmentId, "assignmentId");
  const assignment = await MembershipRole.findOne({
    _id: assignmentId,
    membershipId,
    revokedAt: null,
  });
  if (!assignment) {
    throw new NotFoundError("Active role assignment not found.");
  }
  return assignment;
}

export async function assignRoleToMember({ teamId, userId, roleId, expiresAt = null, assignedBy }) {
  validateObjectId(roleId, "roleId");

  const team = await Team.findById(teamId);
  if (!team || team.status === "ARCHIVED") {
    throw new NotFoundError("Team not found.");
  }

  const user = await User.findById(userId);
  if (!user || user.accountStatus === "DISABLED") {
    throw new NotFoundError("User not found or account is disabled.");
  }

  const membership = await getActiveMembership({ userId, teamId });

  const role = await Role.findById(roleId);
  if (!role || role.status !== "ACTIVE") {
    throw new NotFoundError("Role not found or is not active.");
  }

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

  const assignment = await MembershipRole.create({
    membershipId: membership._id,
    roleId: role._id,
    assignedBy,
    assignedAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  return getAssignmentById(assignment._id);
}

export async function updateRoleAssignmentTtl({ teamId, userId, assignmentId, expiresAt }) {
  const membership = await getActiveMembership({ userId, teamId });
  const assignment = await getActiveAssignment({ assignmentId, membershipId: membership._id });

  assignment.expiresAt = expiresAt ? new Date(expiresAt) : null;
  await assignment.save();

  return getAssignmentById(assignment._id);
}

export async function revokeRoleAssignment({ teamId, userId, assignmentId, revokedBy }) {
  const membership = await getActiveMembership({ userId, teamId });
  const assignment = await getActiveAssignment({ assignmentId, membershipId: membership._id });

  assignment.revokedAt = new Date();
  assignment.revokedBy = revokedBy;
  await assignment.save();

  return {
    success: true,
    message: "Role assignment revoked successfully.",
  };
}

export async function listMemberRoles({ teamId, userId }) {
  const membership = await getActiveMembership({ userId, teamId });

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
