import mongoose from "mongoose";

export function isValidObjectId(id) {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(String(id));
}

export function toObjectId(id) {
  if (!isValidObjectId(id)) return null;
  return new mongoose.Types.ObjectId(String(id));
}

export function normalizeEmail(email) {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim();
}

export function normalizeKey(key) {
  if (!key || typeof key !== "string") return "";
  return key.toLowerCase().trim();
}
