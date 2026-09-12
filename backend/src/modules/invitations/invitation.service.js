import mongoose from "mongoose";
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
import { emitToTeam } from "../../realtime/event-emitter.js";
import { createNotification } from "../notifications/notification.service.js";
import { sendInvitationEmail, sendRoleAssignedEmail } from "../../common/email/email.service.js";
import { env } from "../../config/env.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../common/errors/index.js";
import { isValidEmail } from "../authentication/authentication.validation.js";
import { delCachePattern } from "../../config/redis.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

export async function createInvitation({ teamId, email, roleIds = [], invitedByUserId }) {
  if (!isValidId(teamId) || !isValidId(invitedByUserId)) {
    throw new BadRequestError("Invalid teamId or invitedByUserId format.");
  }
  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    throw new BadRequestError("A valid email address is required.");
  }
  const normalizedEmail = email.trim().toLowerCase();

  const team = await Team.findOne({ _id: teamId, status: { $ne: "ARCHIVED" } });
  if (!team) throw new NotFoundError("Team not found or is archived.");

  let resolvedRoleIds = Array.isArray(roleIds) ? roleIds : [];
  if (resolvedRoleIds.length > 0) {
    if (!resolvedRoleIds.every(isValidId)) throw new BadRequestError("One or more role IDs have an invalid format.");
    const count = await Role.countDocuments({ _id: { $in: resolvedRoleIds }, status: "ACTIVE" });
    if (count !== resolvedRoleIds.length) throw new BadRequestError("One or more assigned roles are invalid or inactive.");
  } else {
    const defaultRole = await Role.findOne({ name: { $in: ["Developer", "Member", "Team Member"] } });
    if (defaultRole) resolvedRoleIds = [defaultRole._id];
  }

  const [inviter, existingUser] = await Promise.all([
    User.findById(invitedByUserId).select("name email"),
    User.findOne({ email: normalizedEmail }),
  ]);
  const inviterName = inviter?.name || "A team administrator";

  if (existingUser && existingUser.accountStatus === "ACTIVE") {
    let membership = await Membership.findOne({ userId: existingUser._id, teamId });
    if (membership && membership.status === "ACTIVE") {
      const existingRoles = await MembershipRole.find({ membershipId: membership._id, roleId: { $in: resolvedRoleIds } });
      if (existingRoles.length === resolvedRoleIds.length && resolvedRoleIds.length > 0) {
        throw new ConflictError("User is already an active member of this team with the specified role(s).");
      }
    } else if (membership) {
      membership.status = "ACTIVE";
      membership.removedAt = null;
      await membership.save();
    } else {
      membership = await Membership.create({ userId: existingUser._id, teamId, status: "ACTIVE" });
    }

    if (resolvedRoleIds.length > 0) {
      for (const roleId of resolvedRoleIds) {
        const exists = await MembershipRole.findOne({ membershipId: membership._id, roleId });
        if (!exists) await MembershipRole.create({ membershipId: membership._id, roleId, assignedBy: invitedByUserId, assignedAt: new Date() });
      }
      await Membership.updateOne({ _id: membership._id }, { $addToSet: { roleIds: { $each: resolvedRoleIds } } });
    }

    const assignedRoles = await Role.find({ _id: { $in: resolvedRoleIds } }).select("name");
    const roleNamesString = assignedRoles.map((r) => r.name).join(", ") || "Team Member";
    const workspaceUrl = `${env.clientUrl || "http://localhost:5173"}/workspaces?teamId=${teamId}`;
    await sendRoleAssignedEmail({ to: normalizedEmail, recipientName: existingUser.name, teamName: team.name, roleName: roleNamesString, workspaceUrl }).catch((err) => {
      console.error("[Invitation Service] Non-fatal role assigned email error:", err.message);
    });
    createNotification({
      recipientId: existingUser._id,
      actorId: invitedByUserId,
      type: "ROLE_ASSIGNED",
      teamId,
      resourceType: "TEAM",
      resourceId: team._id,
      metadata: { teamId: team._id, teamName: team.name, roleName: roleNamesString },
    }).catch(() => {});

    logAuditEvent({
      actorId: invitedByUserId,
      action: "user.role_assigned",
      targetType: "User",
      targetId: existingUser._id,
      teamId,
      result: "SUCCESS",
      metadata: { email: normalizedEmail, roleNames: roleNamesString, isDirectAssignment: true },
    });

    await Promise.all([
      delCachePattern("teams:*"),
      delCachePattern("users:*"),
    ]);

    return {
      isDirectAssignment: true,
      isExistingUser: true,
      email: normalizedEmail,
      teamId,
      roleIds: resolvedRoleIds,
      status: "ACTIVE",
      message: `User is already active. Successfully added to team "${team.name}" as ${roleNamesString}.`,
      user: { id: existingUser._id, name: existingUser.name, email: existingUser.email, role: roleNamesString },
    };
  }

  const existingInvite = await Invitation.findOne({ teamId, email: normalizedEmail, status: "PENDING", expiresAt: { $gt: new Date() } });
  if (existingInvite) throw new ConflictError("A pending invitation already exists for this email in this team.");

  if (existingUser && ["SUSPENDED", "DISABLED"].includes(existingUser.accountStatus)) {
    existingUser.accountStatus = "INVITED";
    await existingUser.save();
  }

  const { rawToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
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

  if (invitation.userId) {
    createNotification({
      recipientId: invitation.userId,
      actorId: invitedByUserId,
      type: "INVITATION_RECEIVED",
      teamId,
      resourceType: "INVITATION",
      resourceId: invitation._id,
      metadata: { invitationId: invitation._id, teamName: team.name },
    }).catch(() => {});
  }

  const inviteUrl = `${env.clientUrl}/invite?token=${rawToken}`;
  await sendInvitationEmail({ to: normalizedEmail, inviterName, teamName: team.name, inviteUrl, expiresAt }).catch((err) => {
    console.error("[Invitation Service] Non-fatal email dispatch error:", err.message);
  });

  logAuditEvent({
    actorId: invitedByUserId,
    action: "invitation.created",
    targetType: "Invitation",
    targetId: invitation._id,
    teamId,
    result: "SUCCESS",
    metadata: { email: normalizedEmail, roleIds: resolvedRoleIds, isReactivation: Boolean(existingUser) },
  });

  return {
    isDirectAssignment: false,
    invitationId: invitation._id,
    email: invitation.email,
    teamId: invitation.teamId,
    roleIds: invitation.roleIds,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    message: `Invitation email successfully dispatched to ${normalizedEmail}.`,
  };
}

export async function verifyInvitation(token) {
  if (!token || typeof token !== "string") throw new BadRequestError("Invitation token is required.");
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) })
    .populate("teamId", "name slug")
    .populate("roleIds", "name description")
    .populate("invitedBy", "name email");

  if (!invitation) throw new NotFoundError("Invitation not found or invalid token.");
  if (invitation.status !== "PENDING") throw new ConflictError("Invitation has already been used or revoked.");
  if (invitation.expiresAt < new Date()) throw new BadRequestError("Invitation token has expired.");

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
  if (!token || typeof token !== "string") throw new BadRequestError("Invitation token is required.");
  const tokenHash = hashToken(token);
  const invitation = await Invitation.findOne({ tokenHash });
  if (!invitation) throw new NotFoundError("Invitation not found or invalid token.");
  if (invitation.status !== "PENDING") throw new ConflictError("Invitation has already been used or revoked.");
  if (invitation.expiresAt < new Date()) throw new BadRequestError("Invitation token has expired.");

  const session = await mongoose.startSession();
  let resolvedUser = null;
  let targetTeam = null;

  try {
    await session.withTransaction(async () => {
      targetTeam = await Team.findById(invitation.teamId).session(session);
      if (!targetTeam || targetTeam.status === "ARCHIVED") throw new NotFoundError("Team not found or is archived.");

      const existingUser = await User.findOne({ email: invitation.email }).session(session);
      if (existingUser) {
        if (["DISABLED", "SUSPENDED", "INVITED"].includes(existingUser.accountStatus)) {
          existingUser.accountStatus = "ACTIVE";
          if (password && typeof password === "string") existingUser.hashedPassword = await hashPassword(password);
          if (name && typeof name === "string") existingUser.name = name.trim();
          await existingUser.save({ session });
        }
        resolvedUser = existingUser;
      } else {
        if (!name || typeof name !== "string" || !password || typeof password !== "string") {
          throw new BadRequestError("Name and password are required for new user registration.");
        }
        const hashedPassword = await hashPassword(password);
        const [newUser] = await User.create([{ name: name.trim(), email: invitation.email, hashedPassword, accountStatus: "ACTIVE", mustChangePassword: false }], { session });
        resolvedUser = newUser;
      }

      let membership = await Membership.findOne({ userId: resolvedUser._id, teamId: invitation.teamId }).session(session);
      if (membership) {
        if (membership.status === "ACTIVE") throw new ConflictError("User is already an active member of this team.");
        membership.status = "ACTIVE";
        membership.removedAt = null;
        await membership.save({ session });
      } else {
        const [newMembership] = await Membership.create([{ userId: resolvedUser._id, teamId: invitation.teamId, status: "ACTIVE" }], { session });
        membership = newMembership;
      }

      if (Array.isArray(invitation.roleIds) && invitation.roleIds.length > 0) {
        await MembershipRole.insertMany(
          invitation.roleIds.map((roleId) => ({ membershipId: membership._id, roleId, assignedBy: invitation.invitedBy, assignedAt: new Date() })),
          { session }
        );
        await Membership.updateOne(
          { _id: membership._id },
          { $addToSet: { roleIds: { $each: invitation.roleIds } } },
          { session }
        );
      }

      invitation.status = "ACCEPTED";
      invitation.acceptedAt = new Date();
      invitation.userId = resolvedUser._id;
      await invitation.save({ session });
    });
  } finally {
    await session.endSession();
  }

  emitToTeam(targetTeam._id, "team:member_joined", { userId: resolvedUser._id, name: resolvedUser.name, email: resolvedUser.email });
  createNotification({
    recipientId: invitation.invitedBy,
    actorId: resolvedUser._id,
    type: "INVITATION_ACCEPTED",
    teamId: targetTeam._id,
    resourceType: "INVITATION",
    resourceId: invitation._id,
    metadata: { userId: resolvedUser._id, userName: resolvedUser.name, teamName: targetTeam.name },
  }).catch(() => {});

  logAuditEvent({
    actorId: resolvedUser._id,
    action: "invitation.accepted",
    targetType: "Invitation",
    targetId: invitation._id,
    teamId: targetTeam._id,
    result: "SUCCESS",
    metadata: { userId: resolvedUser._id, teamId: targetTeam._id },
  });

  await Promise.all([
    delCachePattern("teams:*"),
    delCachePattern("users:*"),
  ]);

  return {
    token: signAccessToken({ sub: resolvedUser._id.toString() }),
    user: { id: resolvedUser._id, name: resolvedUser.name, email: resolvedUser.email, accountStatus: resolvedUser.accountStatus },
    team: { id: targetTeam._id, name: targetTeam.name, slug: targetTeam.slug },
    invitationId: invitation._id,
  };
}

export async function getTeamInvitations({ teamId, status }) {
  if (!isValidId(teamId)) throw new BadRequestError("Invalid teamId format.");
  const team = await Team.findOne({ _id: teamId, status: { $ne: "ARCHIVED" } });
  if (!team) throw new NotFoundError("Team not found or is archived.");

  const filter = { teamId, ...(status ? { status } : {}) };
  const invitations = await Invitation.find(filter).populate("roleIds", "name isSystemRole").populate("invitedBy", "name email").sort({ createdAt: -1 });

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
  if (!isValidId(teamId) || !isValidId(invitationId)) throw new BadRequestError("Invalid teamId or invitationId format.");
  const invitation = await Invitation.findOne({ _id: invitationId, teamId });
  if (!invitation) throw new NotFoundError("Invitation not found.");
  if (invitation.status !== "PENDING") throw new ConflictError("Only pending invitations can be revoked.");

  invitation.status = "REVOKED";
  invitation.revokedAt = new Date();
  await invitation.save();

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
