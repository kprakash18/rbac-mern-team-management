/**
 * Utility to standardize pagination query parsing and calculations
 */
export function getPaginationParams({ page = 1, limit = 20, maxLimit = 100 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
    calculateTotalPages: (total) => Math.ceil(total / limitNum),
  };
}

export default { getPaginationParams };
