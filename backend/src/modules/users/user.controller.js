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

export const userController = { searchUsers };
export default userController;
