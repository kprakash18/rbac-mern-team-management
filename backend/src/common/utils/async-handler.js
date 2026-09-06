/**
 * Higher-order function to wrap async Express route handlers.
 * Catches any unhandled rejections and forwards them to next(error).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
