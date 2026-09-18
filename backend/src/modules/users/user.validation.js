import {
  atLeastOneBodyField,
  optionalArray,
  optionalBoolean,
  optionalDate,
  optionalEnum,
  optionalObject,
  optionalString,
  requiredObjectId,
} from "../../common/middleware/validate-request.js";

export const userIdParamSchema = {
  params: {
    userId: requiredObjectId(),
  },
};

export const searchUsersSchema = {
  query: {
    q: optionalString({ max: 100 }),
    query: optionalString({ max: 100 }),
    status: optionalEnum(["INVITED", "ACTIVE", "SUSPENDED", "DISABLED"]),
  },
};

export const updateUserSchema = {
  params: {
    userId: requiredObjectId(),
  },
  body: {
    name: optionalString({ max: 100 }),
    accountStatus: optionalEnum(["INVITED", "ACTIVE", "SUSPENDED", "DISABLED"]),
    status: optionalEnum(["INVITED", "ACTIVE", "SUSPENDED", "DISABLED"]),
    statusType: optionalEnum(["INVITED", "ACTIVE", "SUSPENDED", "DISABLED"]),
    mustChangePassword: optionalBoolean(),
    isSuperAdmin: optionalBoolean(),
    lastLogoutAt: optionalDate(),
    workspaces: optionalArray({ itemValidator: optionalObject(), max: 200 }),
  },
  custom: [
    atLeastOneBodyField([
      "name",
      "accountStatus",
      "status",
      "statusType",
      "mustChangePassword",
      "isSuperAdmin",
      "lastLogoutAt",
      "workspaces",
    ]),
  ],
};
