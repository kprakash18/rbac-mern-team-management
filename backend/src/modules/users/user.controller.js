import { userService } from "./user.service.js";

export async function searchUsers(req, res, next) {
  try {
    const { q, query, page, limit } = req.query;
    const searchParam = q || query || "";
    const result = await userService.searchUsers({ query: searchParam, page, limit });
    return res.status(200).json({ success: true, data: result.users, pagination: result });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const actorId = req.user?.id || req.user?.sub;
    const updatedUser = await userService.updateUser(userId, req.body, actorId);
    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export const userController = { searchUsers, updateUser };
export default userController;
