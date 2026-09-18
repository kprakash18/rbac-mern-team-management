import {
  atLeastOneBodyField,
  optionalEnum,
  optionalString,
  requiredObjectId,
  requiredString,
} from "../../common/middleware/validate-request.js";

export const createTeamSchema = {
  body: {
    name: requiredString({ max: 100 }),
    description: optionalString({ max: 500 }),
  },
};

export const listTeamsSchema = {
  query: {
    status: optionalEnum(["ACTIVE", "ARCHIVED", "ALL"]),
    search: optionalString({ max: 100 }),
  },
};

export const teamIdParamSchema = {
  params: {
    teamId: requiredObjectId(),
  },
};

export const updateTeamSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  body: {
    name: optionalString({ max: 100 }),
    description: optionalString({ max: 500 }),
    status: optionalEnum(["ACTIVE", "ARCHIVED"]),
  },
  custom: [
    atLeastOneBodyField(["name", "description", "status"]),
  ],
};
