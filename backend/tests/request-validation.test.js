import test from "node:test";
import assert from "node:assert/strict";
import {
  optionalEnum,
  requiredObjectId,
  requiredString,
  validateRequest,
} from "../src/common/middleware/validate-request.js";

function runValidation({ schema, req }) {
  return new Promise((resolve) => {
    validateRequest(schema)(req, {}, (err) => resolve(err || null));
  });
}

test.describe("Request validation middleware", () => {
  test("passes valid params and body", async () => {
    const err = await runValidation({
      schema: {
        params: { teamId: requiredObjectId() },
        body: {
          title: requiredString({ max: 20 }),
          priority: optionalEnum(["LOW", "HIGH"]),
        },
      },
      req: {
        params: { teamId: "507f1f77bcf86cd799439011" },
        body: { title: "Ship it", priority: "HIGH" },
        query: {},
      },
    });

    assert.equal(err, null);
  });

  test("returns ValidationError details for invalid input", async () => {
    const err = await runValidation({
      schema: {
        params: { teamId: requiredObjectId() },
        body: {
          title: requiredString({ max: 5 }),
          priority: optionalEnum(["LOW", "HIGH"]),
        },
      },
      req: {
        params: { teamId: "not-an-id" },
        body: { title: "Too long title", priority: "URGENT" },
        query: {},
      },
    });

    assert.equal(err.name, "ValidationError");
    assert.equal(err.code, "VALIDATION_ERROR");
    assert.equal(err.details.length, 3);
    assert.deepEqual(
      err.details.map((detail) => detail.field),
      ["params.teamId", "body.title", "body.priority"]
    );
  });
});
