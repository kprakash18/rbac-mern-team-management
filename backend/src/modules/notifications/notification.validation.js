import {
  atLeastOneBodyField,
  optionalArray,
  optionalBoolean,
  optionalDate,
  optionalEnum,
  optionalObject,
  optionalObjectId,
  optionalString,
  requiredObjectId,
  requiredString,
} from "../../common/middleware/validate-request.js";

const BROADCAST_TYPES = ["OUTAGE", "MAINTENANCE", "POLICY", "ANNOUNCEMENT"];
const BROADCAST_SCOPES = ["GLOBAL", "WORKSPACE_SCOPED", "ROLE_SCOPED"];
const BROADCAST_STATUSES = ["ACTIVE", "SCHEDULED", "ENDED"];

export const teamBroadcastSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  body: {
    title: requiredString({ max: 200 }),
    message: optionalString({ max: 5000 }),
    body: optionalString({ max: 5000 }),
    type: optionalEnum(BROADCAST_TYPES),
    isSticky: optionalBoolean(),
    requiresAck: optionalBoolean(),
    startsAt: optionalDate(),
    expiresAt: optionalDate(),
  },
};

export const broadcastIdParamSchema = {
  params: {
    broadcastId: requiredObjectId(),
  },
};

export const activeBulletinsSchema = {
  query: {
    teamId: optionalObjectId(),
  },
};

export const listNotificationsSchema = {
  query: {
    unreadOnly: optionalEnum(["TRUE", "FALSE"]),
  },
};

export const notificationIdParamSchema = {
  params: {
    notificationId: requiredObjectId(),
  },
};

export const createGlobalBroadcastSchema = {
  body: {
    title: requiredString({ max: 200 }),
    message: optionalString({ max: 5000 }),
    body: optionalString({ max: 5000 }),
    type: optionalEnum(BROADCAST_TYPES),
    severity: optionalString({ max: 50 }),
    scope: optionalEnum(BROADCAST_SCOPES),
    targetWorkspaces: optionalArray({ max: 500 }),
    targetRoles: optionalArray({ max: 500 }),
    ackMode: optionalEnum(["NONE", "READ_RECEIPT", "MANDATORY_ACK"]),
    cta: optionalObject(),
    metrics: optionalObject(),
    workspaceBreakdown: optionalArray({ max: 1000 }),
    roleBreakdown: optionalArray({ max: 1000 }),
    isSticky: optionalBoolean(),
    requiresAck: optionalBoolean(),
    scheduledDate: optionalDate(),
    expireDate: optionalDate(),
    startsAt: optionalDate(),
    expiresAt: optionalDate(),
  },
};

export const updateGlobalBroadcastSchema = {
  params: {
    broadcastId: requiredObjectId(),
  },
  body: {
    title: optionalString({ max: 200 }),
    message: optionalString({ max: 5000 }),
    body: optionalString({ max: 5000 }),
    type: optionalEnum(BROADCAST_TYPES),
    severity: optionalString({ max: 50 }),
    scope: optionalEnum(BROADCAST_SCOPES),
    targetWorkspaces: optionalArray({ max: 500 }),
    targetRoles: optionalArray({ max: 500 }),
    ackMode: optionalEnum(["NONE", "READ_RECEIPT", "MANDATORY_ACK"]),
    status: optionalEnum(BROADCAST_STATUSES),
    cta: optionalObject(),
    isSticky: optionalBoolean(),
    requiresAck: optionalBoolean(),
    startsAt: optionalDate(),
    expiresAt: optionalDate(),
  },
  custom: [
    atLeastOneBodyField([
      "title",
      "message",
      "body",
      "type",
      "severity",
      "scope",
      "targetWorkspaces",
      "targetRoles",
      "ackMode",
      "status",
      "cta",
      "isSticky",
      "requiresAck",
      "startsAt",
      "expiresAt",
    ]),
  ],
};
