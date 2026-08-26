import User from "./user.model.js";

export async function searchUsers({ query = "", page = 1, limit = 20 } = {}) {
  const filter = { accountStatus: { $ne: "DISABLED" } };

  if (query && typeof query === "string" && query.trim().length > 0) {
    const trimmed = query.trim();
    filter.$or = [
      { name: { $regex: trimmed, $options: "i" } },
      { email: { $regex: trimmed, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

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
    totalPages: Math.ceil(total / limitNum),
  };
}

export const userService = { searchUsers };
export default userService;
