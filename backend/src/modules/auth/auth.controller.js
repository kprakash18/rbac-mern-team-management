import {
  login,
  getCurrentUser,
  changePassword,
  logout,
} from "./auth.service.js";

/**
 * Handle user login.
 * POST /api/auth/login
 */
export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 */
export async function meController(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change current user password.
 * POST /api/auth/change-password
 */
export async function changePasswordController(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changePassword(req.user.id, { currentPassword, newPassword });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: { user: result.user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout current user.
 * POST /api/auth/logout
 */
export async function logoutController(req, res, next) {
  try {
    const result = await logout(req.user.id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
