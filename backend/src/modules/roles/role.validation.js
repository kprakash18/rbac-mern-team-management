import {
  atLeastOneBodyField,
  optionalArray,
  optionalEnum,
  optionalObjectId,
  optionalString,
  requiredArray,
  requiredObjectId,
  requiredString,
} from "../../common/middleware/validate-request.js";

export const createRoleSchema = {
  body: {
    name: requiredString({ max: 100 }),
    description: optionalString({ max: 500 }),
    permissionIds: optionalArray({ itemValidator: optionalObjectId(), max: 500 }),
  },
};

export const updateRoleSchema = {
  params: {
    roleId: requiredObjectId(),
  },
  body: {
    name: optionalString({ max: 100 }),
    description: optionalString({ max: 500 }),
    status: optionalEnum(["ACTIVE", "DISABLED", "ARCHIVED"]),
    permissionIds: optionalArray({ itemValidator: optionalObjectId(), max: 500 }),
  },
  custom: [
    atLeastOneBodyField(["name", "description", "status", "permissionIds"]),
  ],
};

export const roleIdParamSchema = {
  params: {
    roleId: requiredObjectId(),
  },
};

export const deleteRoleSchema = {
  params: {
    roleId: requiredObjectId(),
  },
  body: {
    reassignToRoleId: optionalObjectId(),
  },
  query: {
    reassignToRoleId: optionalObjectId(),
  },
};

export const assignRolePermissionsSchema = {
  params: {
    roleId: requiredObjectId(),
  },
  body: {
    permissionIds: requiredArray({ itemValidator: optionalObjectId(), min: 1, max: 500 }),
  },
};

export const rolePermissionParamSchema = {
  params: {
    roleId: requiredObjectId(),
    permissionId: requiredObjectId(),
  },
};
