import { ForbiddenError } from "../errors/index.js";

/**
 * Middleware that restricts users who are flagged with `mustChangePassword === true`
 * from accessing general application endpoints until they update their credentials.
 */
export function requirePasswordChangeCompleted(req, res, next) {
  if (req.user && req.user.mustChangePassword) {
    throw new ForbiddenError(
      "Password change is required before accessing this resource.",
      "PASSWORD_CHANGE_REQUIRED"
    );
  }
  next();
}
