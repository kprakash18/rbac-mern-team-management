import {
  atLeastOneBodyField,
  optionalDate,
  optionalNumber,
  optionalObjectId,
  optionalString,
  requiredObjectId,
} from "../../common/middleware/validate-request.js";

function requirePermissionIdentifier(req) {
  const body = req.body || {};
  if (body.permissionKey || body.permissionId) return null;
  return {
    field: "body",
    message: "must include permissionKey or permissionId.",
  };
}

export const createAccessRequestSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  body: {
    targetUserId: optionalObjectId(),
    permissionId: optionalObjectId(),
    permissionKey: optionalString({ max: 150 }),
    resource: optionalString({ max: 250 }),
    reason: optionalString({ max: 1000 }),
    durationHours: optionalNumber({ min: 0.05, max: 720 }),
    durationMinutes: optionalNumber({ min: 1, max: 43200 }),
  },
  custom: [requirePermissionIdentifier],
};

export const updateAccessRequestSchema = {
  params: {
    teamId: requiredObjectId(),
    requestId: requiredObjectId(),
  },
  body: {
    permissionKey: optionalString({ max: 150 }),
    resource: optionalString({ max: 250 }),
    reason: optionalString({ max: 1000 }),
    durationHours: optionalNumber({ min: 0.05, max: 720 }),
  },
  custom: [
    atLeastOneBodyField(["permissionKey", "resource", "reason", "durationHours"]),
  ],
};

export const approveAccessRequestSchema = {
  params: {
    teamId: requiredObjectId(),
    requestId: requiredObjectId(),
  },
  body: {
    durationHours: optionalNumber({ min: 0.05, max: 720 }),
  },
};

export const rejectAccessRequestSchema = {
  params: {
    teamId: requiredObjectId(),
    requestId: requiredObjectId(),
  },
  body: {
    reason: optionalString({ max: 1000 }),
  },
};

export const accessRequestIdParamSchema = {
  params: {
    teamId: requiredObjectId(),
    requestId: requiredObjectId(),
  },
};

export const accessGrantIdParamSchema = {
  params: {
    teamId: requiredObjectId(),
    grantId: requiredObjectId(),
  },
};

export const globalAccessRequestIdParamSchema = {
  params: {
    requestId: requiredObjectId(),
  },
};

export const globalApproveAccessRequestSchema = {
  params: {
    requestId: requiredObjectId(),
  },
  body: {
    durationHours: optionalNumber({ min: 0.05, max: 720 }),
  },
};

export const globalRejectAccessRequestSchema = {
  params: {
    requestId: requiredObjectId(),
  },
  body: {
    reason: optionalString({ max: 1000 }),
  },
};
