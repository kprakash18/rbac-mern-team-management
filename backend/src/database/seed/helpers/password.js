import bcrypt from "bcryptjs";

export const DEFAULT_PASSWORD = "Password123!";

/**
 * Hash a plain text password using bcryptjs.
 * @param {string} password
 * @param {number} saltRounds
 * @returns {Promise<string>}
 */
export async function hashPassword(password = DEFAULT_PASSWORD, saltRounds = 10) {
  return bcrypt.hash(password, saltRounds);
}
