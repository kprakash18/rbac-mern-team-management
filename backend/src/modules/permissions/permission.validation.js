import {
  optionalEnum,
  requiredObjectId,
} from "../../common/middleware/validate-request.js";

export const listPermissionsSchema = {
  query: {
    category: optionalEnum([
      "USER_MANAGEMENT",
      "TEAM_MANAGEMENT",
      "AUTHORIZATION",
      "ACCESS_CONTROL",
      "NOTIFICATION",
      "SECURITY",
      "TASK_MANAGEMENT",
    ]),
    scope: optionalEnum(["TEAM", "GLOBAL", "ALL", "team", "global", "all"]),
  },
};

export const permissionIdParamSchema = {
  params: {
    permissionId: requiredObjectId(),
  },
};
