import Invitation from "./invitation.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../memberships/membership-role.model.js";
import { generateInvitationToken, hashToken } from "./invitations.utils.js";
import { hashPassword } from "../../common/security/password.js";
import { signAccessToken } from "../../common/security/jwt.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { emitToUser, emitToTeam } from "../../realtime/event-emitter.js";
import { createNotification } from "../notifications/notification.service.js";
import { sendInvitationEmail } from "../../common/email/email.service.js";
import { env } from "../../config/env.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
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
      status: "ACTIVE",
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

  // 7. Generate Token & Save Invitation (1-hour TTL)
  const { rawToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

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

  // Real-time Event Emissions & Persistent Notification (if invited user has existing account)
  if (invitation.userId) {
    emitToUser(invitation.userId, "notification:new", {
      type: "INVITATION",
      title: "New Team Invitation",
      teamId,
      invitationId: invitation._id,
    });
    createNotification({
      recipientId: invitation.userId,
      type: "INVITATION",
      title: "New Team Invitation",
      message: `You have been invited to join team ${team.name}.`,
      teamId,
      metadata: { invitationId: invitation._id },
    }).catch((err) => console.error("Failed to persist notification:", err));
  }

  // Send invitation email asynchronously
  const inviter = await User.findById(invitedByUserId).select("name");
  const inviteUrl = `${env.clientUrl}/invite?token=${rawToken}`;
  sendInvitationEmail({
    to: normalizedEmail,
    inviterName: inviter?.name || "A team administrator",
    teamName: team.name,
    inviteUrl,
    expiresAt,
  }).catch((err) => console.error("Email dispatch failed:", err));

  // Audit Logging
  logAuditEvent({
    actorId: invitedByUserId,
    action: "invitation.created",
    targetType: "Invitation",
    targetId: invitation._id,
    teamId,
    result: "SUCCESS",
    metadata: {
      email: normalizedEmail,
      roleIds,
    },
  });



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

export async function acceptInvitation({ token, name, password }) {
  // 1. Validation & Hash Lookup
  if (!token || typeof token !== "string") {
    throw new BadRequestError("Invitation token is required.");
  }

  const tokenHash = hashToken(token);
  const invitation = await Invitation.findOne({ tokenHash });

  if (!invitation) {
    throw new NotFoundError("Invitation not found or invalid token.");
  }

  if (invitation.status !== "PENDING") {
    throw new ConflictError("Invitation has already been used or revoked.");
  }

  if (invitation.expiresAt < new Date()) {
    throw new BadRequestError("Invitation token has expired.");
  }

  // 2. Transaction Session Setup
  const session = await mongoose.startSession();
  let resolvedUser = null;
  let targetTeam = null;

  try {
    await session.withTransaction(async () => {
      // Step A: Fetch & Validate Team
      targetTeam = await Team.findById(invitation.teamId).session(session);
      if (!targetTeam || targetTeam.status === "ARCHIVED") {
        throw new NotFoundError("Team not found or is archived.");
      }

      // Step B: Resolve Existing vs New User
      const existingUser = await User.findOne({ email: invitation.email }).session(session);

      if (existingUser) {
        if (existingUser.accountStatus === "DISABLED" || existingUser.accountStatus === "SUSPENDED") {
          throw new ForbiddenError("Your account is suspended or disabled.");
        }
        if (existingUser.accountStatus === "INVITED") {
          existingUser.accountStatus = "ACTIVE";
          await existingUser.save({ session });
        }
        resolvedUser = existingUser;
      } else {
        if (!name || typeof name !== "string" || !password || typeof password !== "string") {
          throw new BadRequestError("Name and password are required for new user registration.");
        }

        const hashedPassword = await hashPassword(password);
        const [newUser] = await User.create(
          [
            {
              name: name.trim(),
              email: invitation.email,
              hashedPassword,
              accountStatus: "ACTIVE",
              mustChangePassword: false,
            },
          ],
          { session }
        );
        resolvedUser = newUser;
      }

      // Step C: Create or Activate Membership
      let membership = await Membership.findOne({
        userId: resolvedUser._id,
        teamId: invitation.teamId,
      }).session(session);

      if (membership) {
        if (membership.status === "ACTIVE") {
          throw new ConflictError("User is already an active member of this team.");
        }
        membership.status = "ACTIVE";
        membership.removedAt = null;
        await membership.save({ session });
      } else {
        const [newMembership] = await Membership.create(
          [
            {
              userId: resolvedUser._id,
              teamId: invitation.teamId,
              status: "ACTIVE",
            },
          ],
          { session }
        );
        membership = newMembership;
      }

      // Step D: Batch Assign Roles
      if (Array.isArray(invitation.roleIds) && invitation.roleIds.length > 0) {
        const roleDocs = invitation.roleIds.map((roleId) => ({
          membershipId: membership._id,
          roleId,
          assignedBy: invitation.invitedBy,
          assignedAt: new Date(),
        }));
        await MembershipRole.insertMany(roleDocs, { session });
      }

      // Step E: Transition Invitation Status
      invitation.status = "ACCEPTED";
      invitation.acceptedAt = new Date();
      invitation.userId = resolvedUser._id;
      await invitation.save({ session });
    });
  } finally {
    await session.endSession();
  }

  // Real-time Event Emissions & Persistent Notification
  emitToTeam(targetTeam._id, "team:member_joined", {
    userId: resolvedUser._id,
    name: resolvedUser.name,
    email: resolvedUser.email,
  });
  emitToUser(invitation.invitedBy, "notification:new", {
    type: "TEAM_MEMBERSHIP",
    title: "Invitation Accepted",
    teamId: targetTeam._id,
    userId: resolvedUser._id,
  });
  createNotification({
    recipientId: invitation.invitedBy,
    type: "TEAM_MEMBERSHIP",
    title: "Invitation Accepted",
    message: `${resolvedUser.name} accepted your invitation to join ${targetTeam.name}.`,
    teamId: targetTeam._id,
    metadata: { userId: resolvedUser._id },
  }).catch((err) => console.error("Failed to persist notification:", err));

  // Audit Logging
  logAuditEvent({
    actorId: resolvedUser._id,
    action: "invitation.accepted",
    targetType: "Invitation",
    targetId: invitation._id,
    teamId: targetTeam._id,
    result: "SUCCESS",
    metadata: {
      userId: resolvedUser._id,
      teamId: targetTeam._id,
    },
  });


  // 3. Post-Transaction Token Issuance
  const accessToken = signAccessToken({ sub: resolvedUser._id.toString() });

  return {
    token: accessToken,
    user: {
      id: resolvedUser._id,
      name: resolvedUser.name,
      email: resolvedUser.email,
      accountStatus: resolvedUser.accountStatus,
    },
    team: {
      id: targetTeam._id,
      name: targetTeam.name,
      slug: targetTeam.slug,
    },
    invitationId: invitation._id,
  };
}

export async function getTeamInvitations({ teamId, status }) {
  // 1. Validate teamId
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new BadRequestError("Invalid teamId format.");
  }

  // 2. Verify Team
  const team = await Team.findOne({ _id: teamId, status: { $ne: "ARCHIVED" } });
  if (!team) {
    throw new NotFoundError("Team not found or is archived.");
  }

  // 3. Build filter & fetch
  const filter = { teamId };
  if (status) {
    filter.status = status;
  }

  const invitations = await Invitation.find(filter)
    .populate("roleIds", "name isSystemRole")
    .populate("invitedBy", "name email")
    .sort({ createdAt: -1 });

  return invitations.map((inv) => ({
    id: inv._id,
    email: inv.email,
    teamId: inv.teamId,
    roles: inv.roleIds,
    invitedBy: inv.invitedBy,
    status: inv.status,
    expiresAt: inv.expiresAt,
    acceptedAt: inv.acceptedAt,
    revokedAt: inv.revokedAt,
    createdAt: inv.createdAt,
  }));
}

export async function revokeInvitation({ teamId, invitationId, revokedByUserId }) {
  // 1. Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(invitationId)) {
    throw new BadRequestError("Invalid teamId or invitationId format.");
  }

  // 2. Find invitation
  const invitation = await Invitation.findOne({ _id: invitationId, teamId });
  if (!invitation) {
    throw new NotFoundError("Invitation not found.");
  }

  // 3. Ensure status is PENDING
  if (invitation.status !== "PENDING") {
    throw new ConflictError("Only pending invitations can be revoked.");
  }

  // 4. Update status and save
  invitation.status = "REVOKED";
  invitation.revokedAt = new Date();
  await invitation.save();

  // Audit Logging
  logAuditEvent({
    actorId: revokedByUserId,
    action: "invitation.revoked",
    targetType: "Invitation",
    targetId: invitation._id,
    teamId,
    result: "SUCCESS",
  });

  return { message: "Invitation revoked successfully." };
}
