import Invitation from "./invitation.model.js";
import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import Role from "../roles/role.model.js";
import Membership from "../memberships/membership.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import { generateInvitationToken, hashToken } from "./invitations.utils.js";

import { hashPassword } from "../../common/security/password.js";
import { signAccessToken } from "../../common/security/jwt.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { emitToUser, emitToTeam } from "../../realtime/event-emitter.js";
import { createNotification } from "../notifications/notification.service.js";
import { sendInvitationEmail, sendRoleAssignedEmail } from "../../common/email/email.service.js";
import { env } from "../../config/env.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../common/errors/index.js";

import mongoose from "mongoose";
import { isValidEmail } from "../authentication/authentication.validation.js";

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
  let resolvedRoleIds = Array.isArray(roleIds) ? roleIds : [];
  if (resolvedRoleIds.length > 0) {
    const allValid = resolvedRoleIds.every((id) => mongoose.Types.ObjectId.isValid(id));
    if (!allValid) {
      throw new BadRequestError("One or more role IDs have an invalid format.");
    }

    const foundCount = await Role.countDocuments({
      _id: { $in: resolvedRoleIds },
      status: "ACTIVE",
    });

    if (foundCount !== resolvedRoleIds.length) {
      throw new BadRequestError("One or more assigned roles are invalid or inactive.");
    }
  } else {
    // If no roles specified, fallback to default Developer / Member role
    const defaultRole = await Role.findOne({ name: { $in: ["Developer", "Member", "Team Member"] } });
    if (defaultRole) {
      resolvedRoleIds = [defaultRole._id];
    }
  }

  // 5. Fetch inviter information
  const inviter = await User.findById(invitedByUserId).select("name email");
  const inviterName = inviter?.name || "A team administrator";

  // 6. Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });

  // === CASE A: Active Existing User -> Direct Role Assignment & Notification ===
  if (existingUser && existingUser.accountStatus === "ACTIVE") {
    // 6a. Find or create active team membership
    let membership = await Membership.findOne({
      userId: existingUser._id,
      teamId,
    });

    if (membership && membership.status === "ACTIVE") {
      // Check if user already has these exact roles
      const existingRoles = await MembershipRole.find({
        membershipId: membership._id,
        roleId: { $in: resolvedRoleIds },
      });
      if (existingRoles.length === resolvedRoleIds.length && resolvedRoleIds.length > 0) {
        throw new ConflictError("User is already an active member of this team with the specified role(s).");
      }
    } else if (membership) {
      membership.status = "ACTIVE";
      membership.removedAt = null;
      await membership.save();
    } else {
      membership = await Membership.create({
        userId: existingUser._id,
        teamId,
        status: "ACTIVE",
      });
    }

    // 6b. Assign Membership Roles
    if (resolvedRoleIds.length > 0) {
      for (const roleId of resolvedRoleIds) {
        const existingRoleLink = await MembershipRole.findOne({
          membershipId: membership._id,
          roleId,
        });
        if (!existingRoleLink) {
          await MembershipRole.create({
            membershipId: membership._id,
            roleId,
            assignedBy: invitedByUserId,
            assignedAt: new Date(),
          });
        }
      }
    }

    // 6c. Get Role names for email & notifications
    const assignedRoles = await Role.find({ _id: { $in: resolvedRoleIds } }).select("name");
    const roleNamesString = assignedRoles.map((r) => r.name).join(", ") || "Team Member";

    // 6d. Send Direct Role Assignment Email (with "Open Workspace" link)
    const workspaceUrl = `${env.clientUrl || "http://localhost:5173"}/workspaces?teamId=${teamId}`;
    sendRoleAssignedEmail({
      to: normalizedEmail,
      recipientName: existingUser.name,
      teamName: team.name,
      roleName: roleNamesString,
      workspaceUrl,
    }).catch((err) => console.error("Role assignment email dispatch failed:", err));

    // 6e. In-App Notification
    createNotification({
      recipientId: existingUser._id,
      actorId: invitedByUserId,
      type: "ROLE_ASSIGNED",
      teamId,
      resourceType: "TEAM",
      resourceId: team._id,
      metadata: {
        teamId: team._id,
        teamName: team.name,
        roleName: roleNamesString,
      },
    }).catch((err) => console.error("Failed to persist notification:", err));

    // 6f. Audit Logging
    logAuditEvent({
      actorId: invitedByUserId,
      action: "user.role_assigned",
      targetType: "User",
      targetId: existingUser._id,
      teamId,
      result: "SUCCESS",
      metadata: {
        email: normalizedEmail,
        roleNames: roleNamesString,
        isDirectAssignment: true,
      },
    });

    return {
      isDirectAssignment: true,
      isExistingUser: true,
      email: normalizedEmail,
      teamId,
      roleIds: resolvedRoleIds,
      status: "ACTIVE",
      message: `User is already active. Successfully added to team "${team.name}" as ${roleNamesString}.`,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: roleNamesString,
      },
    };
  }

  // === CASE B & C: New User or Suspended/Disabled User -> Invitation & Onboarding Flow ===

  // Check Pending Invitation Collision
  const existingInvite = await Invitation.findOne({
    teamId,
    email: normalizedEmail,
    status: "PENDING",
    expiresAt: { $gt: new Date() },
  });
  if (existingInvite) {
    throw new ConflictError("A pending invitation already exists for this email in this team.");
  }

  // If user exists but is suspended or disabled, mark as invited for re-activation
  if (existingUser && (existingUser.accountStatus === "SUSPENDED" || existingUser.accountStatus === "DISABLED")) {
    existingUser.accountStatus = "INVITED";
    await existingUser.save();
  }

  // Generate Token & Save Invitation (1-hour TTL)
  const { rawToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    email: normalizedEmail,
    userId: existingUser ? existingUser._id : null,
    teamId,
    invitedBy: invitedByUserId,
    roleIds: resolvedRoleIds,
    tokenHash,
    expiresAt,
    status: "PENDING",
  });

  // Real-time Event Emissions & Persistent Notification (if user doc exists)
  if (invitation.userId) {
    createNotification({
      recipientId: invitation.userId,
      actorId: invitedByUserId,
      type: "INVITATION_RECEIVED",
      teamId,
      resourceType: "INVITATION",
      resourceId: invitation._id,
      metadata: { invitationId: invitation._id, teamName: team.name },
    }).catch((err) => console.error("Failed to persist notification:", err));
  }

  // Send invitation email asynchronously (with token link to onboarding)
  const inviteUrl = `${env.clientUrl}/invite?token=${rawToken}`;
  sendInvitationEmail({
    to: normalizedEmail,
    inviterName,
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
      roleIds: resolvedRoleIds,
      isReactivation: Boolean(existingUser),
    },
  });

  return {
    isDirectAssignment: false,
    invitationId: invitation._id,
    email: invitation.email,
    teamId: invitation.teamId,
    roleIds: invitation.roleIds,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    token: rawToken,
    inviteLink: inviteUrl,
  };
}

export async function verifyInvitation(token) {
  if (!token || typeof token !== "string") {
    throw new BadRequestError("Invitation token is required.");
  }

  const tokenHash = hashToken(token);
  const invitation = await Invitation.findOne({ tokenHash })
    .populate("teamId", "name slug")
    .populate("roleIds", "name description")
    .populate("invitedBy", "name email");

  if (!invitation) {
    throw new NotFoundError("Invitation not found or invalid token.");
  }

  if (invitation.status !== "PENDING") {
    throw new ConflictError("Invitation has already been used or revoked.");
  }

  if (invitation.expiresAt < new Date()) {
    throw new BadRequestError("Invitation token has expired.");
  }

  const existingUser = await User.findOne({ email: invitation.email });
  const isExistingUser = Boolean(existingUser && existingUser.accountStatus === "ACTIVE");

  return {
    invitationId: invitation._id,
    email: invitation.email,
    teamId: invitation.teamId,
    team: invitation.teamId,
    roleId: invitation.roleIds?.[0] || null,
    role: invitation.roleIds?.[0] || null,
    roles: invitation.roleIds,
    invitedBy: invitation.invitedBy,
    expiresAt: invitation.expiresAt,
    isExistingUser,
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
        // Reactivate suspended, disabled, or invited accounts upon accepting valid admin invitation
        if (
          existingUser.accountStatus === "DISABLED" ||
          existingUser.accountStatus === "SUSPENDED" ||
          existingUser.accountStatus === "INVITED"
        ) {
          existingUser.accountStatus = "ACTIVE";
          if (password && typeof password === "string") {
            existingUser.hashedPassword = await hashPassword(password);
          }
          if (name && typeof name === "string") {
            existingUser.name = name.trim();
          }
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
  createNotification({
    recipientId: invitation.invitedBy,
    actorId: resolvedUser._id,
    type: "INVITATION_ACCEPTED",
    teamId: targetTeam._id,
    resourceType: "INVITATION",
    resourceId: invitation._id,
    metadata: {
      userId: resolvedUser._id,
      userName: resolvedUser.name,
      teamName: targetTeam.name,
    },
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
