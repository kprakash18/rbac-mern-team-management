/**
 * Higher-order function to wrap asynchronous express route handlers and forward uncaught errors to next().
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
