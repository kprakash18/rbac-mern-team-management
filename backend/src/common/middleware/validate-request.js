import mongoose from "mongoose";
import { ValidationError } from "../errors/index.js";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function runFieldValidators(source = {}, validators = {}, sourceName) {
  const errors = [];
  for (const [field, validator] of Object.entries(validators || {})) {
    const error = validator(source[field], source, field);
    if (error) errors.push({ field: `${sourceName}.${field}`, message: error });
  }
  return errors;
}

export function validateRequest(schema = {}) {
  return (req, res, next) => {
    const errors = [
      ...runFieldValidators(req.params, schema.params, "params"),
      ...runFieldValidators(req.query, schema.query, "query"),
      ...runFieldValidators(req.body, schema.body, "body"),
    ];

    for (const customValidator of schema.custom || []) {
      const customErrors = customValidator(req);
      if (Array.isArray(customErrors)) errors.push(...customErrors);
      else if (customErrors) errors.push({ field: "request", message: customErrors });
    }

    if (errors.length > 0) {
      return next(new ValidationError("Request validation failed.", errors));
    }

    return next();
  };
}

export function requiredString({ min = 1, max = 500 } = {}) {
  return (value) => {
    if (typeof value !== "string") return "must be a string.";
    const trimmed = value.trim();
    if (trimmed.length < min) return `must be at least ${min} character(s).`;
    if (trimmed.length > max) return `must be at most ${max} character(s).`;
    return null;
  };
}

export function optionalString({ max = 500 } = {}) {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string") return "must be a string.";
    if (value.trim().length > max) return `must be at most ${max} character(s).`;
    return null;
  };
}

export function requiredEmail() {
  return (value) => {
    if (typeof value !== "string" || !value.trim()) return "is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "must be a valid email address.";
    return null;
  };
}

export function requiredObjectId() {
  return (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(String(value))) return "must be a valid ObjectId.";
    return null;
  };
}

export function optionalObjectId() {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (!mongoose.Types.ObjectId.isValid(String(value))) return "must be a valid ObjectId.";
    return null;
  };
}

export function optionalEnum(values = []) {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (!values.includes(String(value).toUpperCase())) return `must be one of: ${values.join(", ")}.`;
    return null;
  };
}

export function optionalDate() {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "must be a valid date.";
    return null;
  };
}

export function optionalNumber({ min = -Infinity, max = Infinity } = {}) {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "must be a number.";
    if (parsed < min) return `must be at least ${min}.`;
    if (parsed > max) return `must be at most ${max}.`;
    return null;
  };
}

export function optionalObject() {
  return (value) => {
    if (value === undefined || value === null) return null;
    if (!isPlainObject(value)) return "must be an object.";
    return null;
  };
}

export function optionalBoolean() {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "boolean") return "must be a boolean.";
    return null;
  };
}

export function optionalArray({ itemValidator = null, max = 1000 } = {}) {
  return (value, source, field) => {
    if (value === undefined || value === null) return null;
    if (!Array.isArray(value)) return "must be an array.";
    if (value.length > max) return `must contain at most ${max} item(s).`;
    if (itemValidator) {
      for (let index = 0; index < value.length; index += 1) {
        const error = itemValidator(value[index], source, `${field}.${index}`);
        if (error) return `item ${index} ${error}`;
      }
    }
    return null;
  };
}

export function requiredArray({ itemValidator = null, min = 1, max = 1000 } = {}) {
  return (value, source, field) => {
    if (!Array.isArray(value)) return "must be an array.";
    if (value.length < min) return `must contain at least ${min} item(s).`;
    if (value.length > max) return `must contain at most ${max} item(s).`;
    if (itemValidator) {
      for (let index = 0; index < value.length; index += 1) {
        const error = itemValidator(value[index], source, `${field}.${index}`);
        if (error) return `item ${index} ${error}`;
      }
    }
    return null;
  };
}

export function atLeastOneBodyField(fields = []) {
  return (req) => {
    const body = req.body || {};
    const hasAny = fields.some((field) => body[field] !== undefined);
    return hasAny ? null : {
      field: "body",
      message: `must include at least one of: ${fields.join(", ")}.`,
    };
  };
}
