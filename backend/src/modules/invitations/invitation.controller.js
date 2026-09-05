import {
  createInvitation,
  verifyInvitation,
  acceptInvitation,
  getTeamInvitations,
  revokeInvitation,
} from "./invitation.service.js";

export const invitationController = {
  verifyInvitation: async (req, res, next) => {
    try {
      const token = req.params.token || req.query.token;
      const data = await verifyInvitation(token);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  createInvitation: async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { email, roleIds } = req.body;
      const invitedByUserId = req.user.id || req.user.sub;

      const data = await createInvitation({
        teamId,
        email,
        roleIds,
        invitedByUserId,
      });

      return res.status(201).json({
        success: true,
        message: "Invitation created successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  acceptInvitation: async (req, res, next) => {
    try {
      const token = req.params.token || req.body.token || req.query.token;
      const { name, password } = req.body;
      const data = await acceptInvitation({ token, name, password });

      return res.status(200).json({
        success: true,
        message: "Invitation accepted successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  getTeamInvitations: async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { status } = req.query;

      const data = await getTeamInvitations({ teamId, status });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  revokeInvitation: async (req, res, next) => {
    try {
      const { teamId, invitationId } = req.params;
      const revokedByUserId = req.user.id || req.user.sub;

      const result = await revokeInvitation({
        teamId,
        invitationId,
        revokedByUserId,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};
