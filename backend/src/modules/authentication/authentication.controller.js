import {
  login,
  getCurrentUser,
  changePassword,
  logout,
} from "./authentication.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/http/response.js";

export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await login({ email, password });
  sendSuccess(res, {
    message: "Login successful.",
    data: result,
  });
});

export const meController = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  sendSuccess(res, {
    data: { user },
  });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await changePassword(req.user.id, { currentPassword, newPassword });
  sendSuccess(res, {
    message: result.message,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const logoutController = asyncHandler(async (req, res) => {
  const result = await logout(req.user.id);
  sendSuccess(res, {
    message: result.message,
  });
});
