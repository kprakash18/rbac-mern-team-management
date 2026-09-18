import {
  optionalArray,
  optionalEnum,
  optionalObjectId,
  optionalString,
  requiredEmail,
  requiredObjectId,
  requiredString,
} from "../../common/middleware/validate-request.js";

export const createInvitationSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  body: {
    email: requiredEmail(),
    name: optionalString({ max: 100 }),
    fullName: optionalString({ max: 100 }),
    roleIds: optionalArray({ itemValidator: optionalObjectId(), max: 20 }),
  },
};

export const listInvitationsSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  query: {
    status: optionalEnum(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]),
  },
};

export const revokeInvitationSchema = {
  params: {
    teamId: requiredObjectId(),
    invitationId: requiredObjectId(),
  },
};

export const invitationTokenParamSchema = {
  params: {
    token: requiredString({ min: 10, max: 500 }),
  },
};

export const acceptInvitationSchema = {
  body: {
    token: optionalString({ max: 500 }),
    name: optionalString({ max: 100 }),
    password: optionalString({ max: 500 }),
  },
};
