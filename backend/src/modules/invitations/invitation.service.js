import Invitation from "./invitation.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import Membership from "../memberships/membership.model.js";
import { generateInvitationToken } from "./invitations.utils.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../common/errors/index.js";
import mongoose from "mongoose";
import { isValidEmail } from "../auth/auth.validation.js";

  export async function createInvitation({ teamId, email, roleIds = [], invitedByUserId }) {
  // 1. Validate IDs
  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(invitedByUserId)) {
    throw new BadRequestError("Invalid teamId or invitedByUserId format.");
  }

  // 2. Validate & Normalize Email
  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    throw new BadRequestError("A valid email address is required.");
  }
  const normalizedEmail = email.trim().toLowerCase();

  // 3. Verify Team
  const team = await Team.findOne({
    _id: teamId,
    status: { $ne: "ARCHIVED" },
  });
  if (!team) {
    throw new NotFoundError("Team not found or is archived.");
  }

  // 4. Validate Role IDs (if provided)
  if (Array.isArray(roleIds) && roleIds.length > 0) {
    const allValid = roleIds.every((id) => mongoose.Types.ObjectId.isValid(id));
    if (!allValid) {
      throw new BadRequestError("One or more role IDs have an invalid format.");
    }

    const foundCount = await Role.countDocuments({
      _id: { $in: roleIds },
      isActive: true,
    });

    if (foundCount !== roleIds.length) {
      throw new BadRequestError("One or more assigned roles are invalid or inactive.");
    }
  }

  // 5. Check Active Membership Collision
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const existingMembership = await Membership.findOne({
      userId: existingUser._id,
      teamId,
      status: "ACTIVE",
    });
    if (existingMembership) {
      throw new ConflictError("User is already an active member of this team.");
    }
  }

  // 6. Check Pending Invitation Collision
  const existingInvite = await Invitation.findOne({
    teamId,
    email: normalizedEmail,
    status: "PENDING",
    expiresAt: { $gt: new Date() },
  });
  if (existingInvite) {
    throw new ConflictError("A pending invitation already exists for this email in this team.");
  }

  // 7. Generate Token & Save Invitation
  const { rawToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // expires in 1 hr

  const invitation = await Invitation.create({
    email: normalizedEmail,
    userId: existingUser ? existingUser._id : null,
    teamId,
    invitedBy: invitedByUserId,
    roleIds,
    tokenHash,
    expiresAt,
    status: "PENDING",
  });

  // 8. Return Sanitized Response
  return {
    invitationId: invitation._id,
    email: invitation.email,
    teamId: invitation.teamId,
    roleIds: invitation.roleIds,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    token: rawToken,
  };
}
