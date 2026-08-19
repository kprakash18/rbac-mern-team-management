import crypto from "crypto";

/**
 * Generate a random invitation token and its SHA-256 hash.
 * @returns {{ rawToken: string, tokenHash: string }}
 */
export function generateInvitationToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Compute SHA-256 hash of a string token.
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
