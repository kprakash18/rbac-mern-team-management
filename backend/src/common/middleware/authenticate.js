import { verifyAccessToken } from "../security/jwt.js";
import User from "../../modules/users/user.model.js";
import { isSuperAdmin } from "../../modules/authorization/authorization.service.js";
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

    if (user.lastLogoutAt && decoded.iat) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      if (tokenIssuedAtMs < user.lastLogoutAt.getTime() - 1000) {
        throw new UnauthorizedError(
          "Session has been logged out. Please log in again.",
          "SESSION_REVOKED"
        );
      }
    }

    // Enforce mandatory password change before accessing general resources
    if (user.mustChangePassword) {
      const allowedAuthEndpoints = ["/api/auth/change-password", "/api/auth/me", "/api/auth/logout"];
      const currentUrl = req.originalUrl || req.baseUrl + req.path;
      const isAllowed = allowedAuthEndpoints.some((endpoint) => currentUrl.startsWith(endpoint));

      if (!isAllowed) {
        throw new ForbiddenError(
          "Password change is required before accessing this resource.",
          "PASSWORD_CHANGE_REQUIRED"
        );
      }
    }

    const userIsSuperAdmin = await isSuperAdmin(user._id);

    // Attach identity representation to req.user
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      accountStatus: user.accountStatus,
      mustChangePassword: Boolean(user.mustChangePassword),
      isSuperAdmin: userIsSuperAdmin,
    };

    next();

  } catch (error) {
    next(error);
  }
}
