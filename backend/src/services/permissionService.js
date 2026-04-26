import UserTeamRole from "../models/userTeamRole.js";

export const getUserPermissions = async (userId, teamId) => {
  // 1. find mapping
  const mapping = await UserTeamRole.findOne({
    user: userId,
    team: teamId
  }).populate({
    path: "role",
    populate: {
      path: "permissions"
    }
  });

  // 2. if no role → no permissions
  if (!mapping || !mapping.role) {
    return [];
  }

  // 3. return permissions
  return mapping.role.permissions;
};