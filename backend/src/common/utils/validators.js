import mongoose from "mongoose";

/**
 * Validates if the input is a valid MongoDB ObjectId string or instance.
 */
export function isValidObjectId(id) {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(String(id));
}

/**
 * Safely converts an ID to a mongoose ObjectId, or returns null if invalid.
 */
export function toObjectId(id) {
  if (!isValidObjectId(id)) return null;
  return new mongoose.Types.ObjectId(String(id));
}

/**
 * Normalizes an email address (lowercase and trimmed).
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim();
}

/**
 * Normalizes a permission or role key (lowercase, trimmed).
 */
export function normalizeKey(key) {
  if (!key || typeof key !== "string") return "";
  return key.toLowerCase().trim();
}
