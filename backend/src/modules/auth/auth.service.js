import User from "../users/user.model.js";
import { comparePassword } from "../../common/security/password.js";
import { signAccessToken } from "../../common/security/jwt.js";
import { validateLoginInput } from "./auth.validation.js";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
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
