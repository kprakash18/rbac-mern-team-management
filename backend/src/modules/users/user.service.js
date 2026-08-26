import User from "./user.model.js";
import { getPaginationParams } from "../../common/utils/pagination.js";

export async function searchUsers({ query = "", page = 1, limit = 20 } = {}) {
  const filter = { accountStatus: { $ne: "DISABLED" } };

  if (query && typeof query === "string" && query.trim().length > 0) {
    const trimmed = query.trim();
    filter.$or = [
      { name: { $regex: trimmed, $options: "i" } },
      { email: { $regex: trimmed, $options: "i" } },
    ];
  }

  const { page: pageNum, limit: limitNum, skip, calculateTotalPages } = getPaginationParams({ page, limit });

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email accountStatus mustChangePassword createdAt")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: calculateTotalPages(total),
  };
}

export const userService = { searchUsers };
export default userService;
