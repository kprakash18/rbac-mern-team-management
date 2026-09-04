/**
 * Centralized Pagination Utility
 *
 * Provides standard parameter sanitization and pagination metadata calculation
 * across all Mongoose services in the backend.
 */

/**
 * Computes standardized pagination parameters with bounds checking.
 *
 * @param {Object} [options]
 * @param {number|string} [options.page=1] - Requested page number (1-indexed)
 * @param {number|string} [options.limit=20] - Requested items per page
 * @param {number} [options.defaultLimit=20] - Fallback items per page
 * @param {number} [options.maxLimit=100] - Upper bound on items per page
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function getPaginationParams({
  page = 1,
  limit = 20,
  defaultLimit = 20,
  maxLimit = 100,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || defaultLimit));
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

/**
 * Computes total pages from total count and limit.
 *
 * @param {number} total - Total document count
 * @param {number} limit - Items per page
 * @returns {number}
 */
export function getTotalPages(total, limit) {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const safeTotal = Math.max(0, Number(total) || 0);
  return Math.ceil(safeTotal / safeLimit);
}

export default {
  getPaginationParams,
  getTotalPages,
};
