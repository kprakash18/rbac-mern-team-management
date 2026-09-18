import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccess } from "../../common/http/response.js";
import { userService } from "./user.service.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const searchParam = req.query.q || req.query.query || "";
  const result = await userService.searchUsers({
    query: searchParam,
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
  });
  sendSuccess(res, { data: result.users, pagination: result });
});

export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();
  sendSuccess(res, { data: stats });
});

export const updateUser = asyncHandler(async (req, res) => {
  const actorId = req.user?.id || req.user?.sub;
  const updatedUser = await userService.updateUser(req.params.userId, req.body, actorId);
  sendSuccess(res, { message: "User updated successfully.", data: updatedUser });
});

export const userController = { searchUsers, getUserStats, updateUser };
export default userController;
