import User from "../users/user.model.js";
import { comparePassword, hashPassword } from "../../common/security/password.js";
import { signAccessToken } from "../../common/security/jwt.js";
import {
  validateLoginInput,
  validatePasswordChangeInput,
} from "./auth.validation.js";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors/index.js";

export async function login({ email, password }) {
  const validation = validateLoginInput({ email, password });
  if (!validation.isValid) {
    throw new BadRequestError(validation.errors.join(" "));
  }

  const normalizedEmail = email.toLowerCase().trim();
  // get user from db with hashed password
  const user = await User.findOne({ email: normalizedEmail }).select("+hashedPassword");

  if (!user) {
    throw new UnauthorizedError("Invalid email or password.", "INVALID_CREDENTIALS");
  }


  // Verify password 
  const isPasswordValid = await comparePassword(password, user.hashedPassword);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password.", "INVALID_CREDENTIALS");
  }

  if (user.accountStatus === "SUSPENDED") {
    throw new ForbiddenError(
      "Your account is currently suspended. Please contact your administrator.",
      "ACCOUNT_SUSPENDED"
    );
  }

  if (user.accountStatus === "DISABLED") {
    throw new ForbiddenError("Your account has been disabled.", "ACCOUNT_DISABLED");
  }


  // Record login 
  user.lastLoginAt = new Date();
  await user.save();

  // Generate JWT access token
  const tokenPayload = {
    sub: user._id.toString(),
  };

  const accessToken = signAccessToken(tokenPayload);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
      mustChangePassword: user.mustChangePassword,
    },
    accessToken,
    requiresPasswordChange: Boolean(user.mustChangePassword),
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found.", "USER_NOT_FOUND");
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    accountStatus: user.accountStatus,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const validation = validatePasswordChangeInput({ currentPassword, newPassword });
  if (!validation.isValid) {
    throw new BadRequestError(validation.errors.join(" "));
  }

  const user = await User.findById(userId).select("+hashedPassword");
  if (!user) {
    throw new NotFoundError("User not found.", "USER_NOT_FOUND");
  }

  const isCurrentValid = await comparePassword(currentPassword, user.hashedPassword);
  if (!isCurrentValid) {
    throw new BadRequestError("Current password is incorrect.", "INVALID_CURRENT_PASSWORD");
  }

  user.hashedPassword = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();

  // If user was INVITED, transition to ACTIVE upon first password change
  if (user.accountStatus === "INVITED") {
    user.accountStatus = "ACTIVE";
  }

  await user.save();

  return {
    message: "Password changed successfully.",
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
  // In stateless JWT auth, server acknowledges logout
  // Future phases: refresh token invalidation / audit log
  return {
    message: "Logged out successfully.",
  };
}

