import { userService } from "./user.service.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const { q, query, page, limit } = req.query;
  const searchParam = q || query || "";
  const result = await userService.searchUsers({ query: searchParam, page, limit });
  res.status(200).json({ success: true, data: result.users, pagination: result });
});

export const userController = { searchUsers };
export default userController;
