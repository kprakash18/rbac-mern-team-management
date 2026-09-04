import User from "./user.model.js";
import { enrichUsersWithWorkspaces } from "./user.lookup.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";

export async function searchUsers({ query = "", page = 1, limit = 50, status } = {}) {
  const filter = {};
  if (status) {
    filter.accountStatus = status.toUpperCase();
  }

  if (query && typeof query === "string" && query.trim().length > 0) {
    const trimmed = query.trim();
    filter.$or = [
      { name: { $regex: trimmed, $options: "i" } },
      { email: { $regex: trimmed, $options: "i" } },
    ];
  }

  const { page: pageNum, limit: limitNum, skip } = getPaginationParams({ page, limit, defaultLimit: 50 });

  const [rawUsers, total] = await Promise.all([
    User.find(filter)
      .select("name email accountStatus mustChangePassword createdAt avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Enrich users with workspaces and roles via lookup utility
  const users = await enrichUsersWithWorkspaces(rawUsers);

  return {
    users,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: getTotalPages(total, limitNum),
  };
}

export const userService = { searchUsers };
export default userService;
