import User from "../users/user.model.js";
import { comparePassword, hashPassword } from "../../common/security/password.js";
import { signAccessToken } from "../../common/security/jwt.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { disconnectUserSockets } from "../../realtime/event-emitter.js";
import { isSuperAdmin, getUserActiveRoleNames } from "../authorization/authorization.service.js";
import { validateLoginInput, validatePasswordChangeInput } from "./authentication.validation.js";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from "../../common/errors/index.js";

export async function login({ email, password }) {
  const validation = validateLoginInput({ email, password });
  if (!validation.isValid) throw new BadRequestError(validation.errors.join(" "));

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+hashedPassword");

  if (!user || !(await comparePassword(password, user.hashedPassword))) {
    logAuditEvent({
      action: "auth.login_failed",
      targetType: "User",
      targetId: user?._id || null,
      result: "FAILURE",
      metadata: { reason: user ? "invalid_password" : "user_not_found", email },
    });
    throw new UnauthorizedError("Invalid email or password.", "INVALID_CREDENTIALS");
  }

  if (user.accountStatus === "SUSPENDED") {
    logAuditEvent({ action: "auth.login_failed", targetType: "User", targetId: user._id, result: "FAILURE", metadata: { reason: "account_suspended" } });
    throw new ForbiddenError("Your account is currently suspended. Please contact your administrator.", "ACCOUNT_SUSPENDED");
  }

  if (user.accountStatus === "DISABLED") {
    logAuditEvent({ action: "auth.login_failed", targetType: "User", targetId: user._id, result: "FAILURE", metadata: { reason: "account_disabled" } });
    throw new ForbiddenError("Your account has been disabled.", "ACCOUNT_DISABLED");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({ sub: user._id.toString() });
  logAuditEvent({ actorId: user._id, action: "auth.login", targetType: "User", targetId: user._id, result: "SUCCESS" });

  const [userIsSuperAdmin, userRoles] = await Promise.all([isSuperAdmin(user._id), getUserActiveRoleNames(user._id)]);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
      mustChangePassword: user.mustChangePassword,
      isSuperAdmin: userIsSuperAdmin,
      role: userIsSuperAdmin ? "Platform Super Admin" : (userRoles[0] || "Member"),
      roles: userRoles,
    },
    accessToken,
    requiresPasswordChange: Boolean(user.mustChangePassword),
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found.", "USER_NOT_FOUND");

  const [userIsSuperAdmin, userRoles] = await Promise.all([isSuperAdmin(user._id), getUserActiveRoleNames(user._id)]);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    accountStatus: user.accountStatus,
    mustChangePassword: user.mustChangePassword,
    isSuperAdmin: userIsSuperAdmin,
    role: userIsSuperAdmin ? "Platform Super Admin" : (userRoles[0] || "Member"),
    roles: userRoles,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const validation = validatePasswordChangeInput({ currentPassword, newPassword });
  if (!validation.isValid) throw new BadRequestError(validation.errors.join(" "));

  const user = await User.findById(userId).select("+hashedPassword");
  if (!user) throw new NotFoundError("User not found.", "USER_NOT_FOUND");

  if (!(await comparePassword(currentPassword, user.hashedPassword))) {
    throw new BadRequestError("Current password is incorrect.", "INVALID_CURRENT_PASSWORD");
  }
  if (currentPassword === newPassword) {
    throw new BadRequestError("New password must be different from your current password.", "PASSWORD_REUSED");
  }

  user.hashedPassword = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  if (user.accountStatus === "INVITED") user.accountStatus = "ACTIVE";
  await user.save();

  const accessToken = signAccessToken({ sub: user._id.toString() });
  logAuditEvent({ actorId: user._id, action: "auth.password_changed", targetType: "User", targetId: user._id, result: "SUCCESS" });

  return {
    message: "Password changed successfully.",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function logout(userId) {
  if (!userId) return { message: "Logged out successfully." };

  await User.findByIdAndUpdate(userId, { $set: { lastLogoutAt: new Date() } });
  disconnectUserSockets(userId);
  logAuditEvent({ actorId: userId, action: "auth.logout", targetType: "User", targetId: userId, result: "SUCCESS" });

  return { message: "Logged out successfully." };
}
