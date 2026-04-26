import { getUserPermissions } from "../services/permissionService.js";

export const getUserPermissionsController = async (req, res) => {
  try {
    const teamId = req.query.teamId;
    const userId = req.query.userId || req.user?.id;

    if (!userId || !teamId) {
      return res.status(400).json({ error: "userId and teamId required" });
    }

    const permissions = await getUserPermissions(userId, teamId);

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};