import { getUserPermissions } from "../services/permissionService.js";

export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const teamId = req.body.teamId || req.query.teamId || req.params.teamId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthenticated user" });
      }

      if (!teamId) {
        return res.status(400).json({ error: "teamId is required for permission check" });
      }

      const permissions = await getUserPermissions(userId, teamId);
      const permissionNames = permissions.map((permission) => permission.name || permission);

      if (!permissionNames.includes(requiredPermission)) {
        return res.status(403).json({ error: `Missing permission: ${requiredPermission}` });
      }

      return next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
};
