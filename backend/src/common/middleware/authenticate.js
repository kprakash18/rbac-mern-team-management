import { verifyAccessToken } from "../security/jwt.js";
import User from "../../modules/users/user.model.js";
import { UnauthorizedError, ForbiddenError } from "../errors/index.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication required. Missing or malformed token.");
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new UnauthorizedError("Access token has expired. Please log in again.", "TOKEN_EXPIRED");
      }
      throw new UnauthorizedError("Invalid access token.", "INVALID_TOKEN");
    }

    // Look up user from subject claim
    const userId = decoded.sub;
    const user = await User.findById(userId);

    if (!user) {
      throw new UnauthorizedError("User account no longer exists.", "USER_NOT_FOUND");
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

    // Attach minimal identity representation to req.user
    req.user = {
      id: user._id,
      email: user.email,
      accountStatus: user.accountStatus,
      mustChangePassword: Boolean(user.mustChangePassword),
    };


    next();
  } catch (error) {
    next(error);
  }
}
