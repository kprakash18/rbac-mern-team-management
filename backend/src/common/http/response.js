export function sendSuccess(res, {
  status = 200,
  data = undefined,
  message = undefined,
  meta = undefined,
  pagination = undefined,
  extra = undefined,
} = {}) {
  const payload = { success: true };

  if (message !== undefined) payload.message = message;
  if (data !== undefined) payload.data = data;
  if (meta !== undefined) payload.meta = meta;
  if (pagination !== undefined) payload.pagination = pagination;
  if (extra && typeof extra === "object") Object.assign(payload, extra);

  return res.status(status).json(payload);
}

export function sendCreated(res, options = {}) {
  return sendSuccess(res, { ...options, status: 201 });
}

export function paginationMeta({ total, page, limit, totalPages }) {
  return { total, page, limit, totalPages };
}

export default {
  sendSuccess,
  sendCreated,
  paginationMeta,
};
