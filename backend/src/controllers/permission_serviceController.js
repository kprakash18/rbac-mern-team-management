import { getUserPermissions } from "../services/permissionService.js";

export const getUserPermissionsController = async (req, res) => {
  try {
    const teamId = req.query.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(400).json({ error: "teamId required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthenticated user" });
    }

    const permissions = await getUserPermissions(userId, teamId);

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};