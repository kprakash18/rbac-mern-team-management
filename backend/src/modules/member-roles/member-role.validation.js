import {
  optionalDate,
  requiredObjectId,
} from "../../common/middleware/validate-request.js";

export const memberRoleRouteParamsSchema = {
  params: {
    teamId: requiredObjectId(),
    userId: requiredObjectId(),
  },
};

export const assignMemberRoleSchema = {
  params: {
    teamId: requiredObjectId(),
    userId: requiredObjectId(),
  },
  body: {
    roleId: requiredObjectId(),
    expiresAt: optionalDate(),
  },
};

export const updateMemberRoleAssignmentSchema = {
  params: {
    teamId: requiredObjectId(),
    userId: requiredObjectId(),
    assignmentId: requiredObjectId(),
  },
  body: {
    expiresAt: optionalDate(),
  },
};

export const memberRoleAssignmentParamSchema = {
  params: {
    teamId: requiredObjectId(),
    userId: requiredObjectId(),
    assignmentId: requiredObjectId(),
  },
};
