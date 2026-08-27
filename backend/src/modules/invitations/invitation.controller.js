import { createInvitation } from "./invitation.service.js";

export const invitationController = {
  createInvitation: async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { email, roleIds } = req.body;
      const invitedByUserId = req.user.sub;

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
};
