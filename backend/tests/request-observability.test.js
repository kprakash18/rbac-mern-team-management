import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../src/common/errors/error.js";
import { errorHandler } from "../src/common/middleware/error-handler.js";
import { requestMetadata } from "../src/common/middleware/request-metadata.js";

function createResponse() {
  const headers = {};
  return {
    headersSent: false,
    statusCode: null,
    payload: null,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return headers[name.toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test.describe("Request observability middleware", () => {
  test("requestMetadata preserves incoming x-request-id and mirrors it in response headers", () => {
    const req = { headers: { "x-request-id": "client-request-123" } };
    const res = createResponse();

    requestMetadata(req, res, () => {});

    assert.equal(req.requestId, "client-request-123");
    assert.equal(res.getHeader("x-request-id"), "client-request-123");
  });

  test("errorHandler includes requestId for operational errors", () => {
    const req = {
      requestId: "req-operational",
      headers: {},
      method: "GET",
      originalUrl: "/api/example",
    };
    const res = createResponse();

    errorHandler(new AppError("Nope", 418, "NOPE"), req, res, () => {});

    assert.equal(res.statusCode, 418);
    assert.equal(res.payload.success, false);
    assert.equal(res.payload.code, "NOPE");
    assert.equal(res.payload.requestId, "req-operational");
  });
});
