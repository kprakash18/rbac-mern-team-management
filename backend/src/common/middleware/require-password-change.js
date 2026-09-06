import { ForbiddenError } from "../errors/index.js";

export function requirePasswordChangeCompleted(req, res, next) {
  if (req.user && req.user.mustChangePassword) {
    throw new ForbiddenError(
      "Password change is required before accessing this resource.",
      "PASSWORD_CHANGE_REQUIRED"
    );
  }
  next();
}
