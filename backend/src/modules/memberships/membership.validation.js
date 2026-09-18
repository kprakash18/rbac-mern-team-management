import {
  optionalEnum,
  optionalObjectId,
  optionalString,
  requiredObjectId,
} from "../../common/middleware/validate-request.js";

export const addMembershipSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  body: {
    userId: requiredObjectId(),
    roleId: optionalObjectId(),
    roleName: optionalString({ max: 100 }),
  },
};

export const listMembershipsSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  query: {
    status: optionalEnum(["ACTIVE", "SUSPENDED", "REMOVED"]),
    q: optionalString({ max: 100 }),
    search: optionalString({ max: 100 }),
  },
};

export const membershipIdParamSchema = {
  params: {
    teamId: requiredObjectId(),
    membershipId: requiredObjectId(),
  },
};
