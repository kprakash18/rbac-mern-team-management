export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code="APP_ERROR"] - Standardized error code
   * @param {any} [details=null] - Additional contextual details / field errors
   */
  constructor(message, statusCode = 500, code = "APP_ERROR", details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Bad request
export class BadRequestError extends AppError {
  constructor(message = "Bad Request", code = "BAD_REQUEST", details = null) {
    super(message, 400, code, details);
  }
}

// Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", code = "UNAUTHORIZED", details = null) {
    super(message, 401, code, details);
  }
}

 // 403 Forbidden
 
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden resource", code = "FORBIDDEN", details = null) {
    super(message, 403, code, details);
  }
}

 //404 Not Found
 
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND", details = null) {
    super(message, 404, code, details);
  }
}

 // 409 Conflict

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", code = "CONFLICT", details = null) {
    super(message, 409, code, details);
  }
}


//  422 Unprocessable Entity / Validation Error

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

  // 500 Internal Server Error
 
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", code = "INTERNAL_SERVER_ERROR", details = null) {
    super(message, 500, code, details);
    this.isOperational = false;
  }
}
