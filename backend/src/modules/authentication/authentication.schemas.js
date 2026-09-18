import {
  requiredEmail,
  requiredString,
} from "../../common/middleware/validate-request.js";

export const loginSchema = {
  body: {
    email: requiredEmail(),
    password: requiredString({ min: 1, max: 500 }),
  },
};

export const changePasswordSchema = {
  body: {
    currentPassword: requiredString({ min: 1, max: 500 }),
    newPassword: requiredString({ min: 8, max: 500 }),
  },
};
