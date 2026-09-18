import crypto from "node:crypto";

const REQUEST_ID_HEADER = "x-request-id";

export function getOrCreateRequestId(req) {
  const incoming = req.headers?.[REQUEST_ID_HEADER];
  if (typeof incoming === "string" && incoming.trim()) {
    return incoming.trim().slice(0, 128);
  }
  return crypto.randomUUID();
}

export function requestMetadata(req, res, next) {
  const requestId = getOrCreateRequestId(req);
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export default requestMetadata;
