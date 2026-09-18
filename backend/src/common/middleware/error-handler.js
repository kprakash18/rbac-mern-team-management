import { AppError } from "../errors/error.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const requestId = req.requestId || req.context?.requestId || req.headers["x-request-id"] || null;

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      requestId,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error("[UnhandledError]", {
    requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    actorId: req.user?.id || null,
    message: err?.message,
    stack: err?.stack,
  });

  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred.",
    requestId,
  });
}
