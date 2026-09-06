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

export function getTotalPages(total, limit) {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const safeTotal = Math.max(0, Number(total) || 0);
  return Math.ceil(safeTotal / safeLimit);
}

export default {
  getPaginationParams,
  getTotalPages,
};
