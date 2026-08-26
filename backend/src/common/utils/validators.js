import mongoose from "mongoose";
import { BadRequestError } from "../errors/index.js";

/**
 * Validates that an ID is a valid MongoDB ObjectId.
 */
export function validateObjectId(id, fieldName = "ID") {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${fieldName} format.`);
  }
  return id;
}

/**
 * Validates that a string input exists and is non-empty after trimming.
 */
export function validateRequiredString(value, fieldName) {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${fieldName} is required.`);
  }
  return value.trim();
}

/**
 * Validates an optional string input (must be string if provided).
 */
export function validateOptionalString(value, fieldName) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new BadRequestError(`${fieldName} must be a string.`);
  }
  return value.trim();
}

/**
 * Validates that an email string is formatted properly.
 */
export function validateEmail(email, fieldName = "Email") {
  const normalized = validateRequiredString(email, fieldName).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new BadRequestError(`Please provide a valid ${fieldName.toLowerCase()}.`);
  }
  return normalized;
}

/**
 * Validates that a value belongs to a specified whitelist of allowed values.
 */
export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new BadRequestError(
      `${fieldName} must be one of: ${allowedValues.join(", ")}.`
    );
  }
  return value;
}

export default {
  validateObjectId,
  validateRequiredString,
  validateOptionalString,
  validateEmail,
  validateEnum,
};
