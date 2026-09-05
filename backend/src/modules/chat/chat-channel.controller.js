import * as channelService from "./chat-channel.service.js";

/**
 * GET /api/teams/:teamId/channels
 * Returns channels visible to the requesting user.
 * Team Admins see all channels; regular members see default + their own.
 */
export async function getChannelsController(req, res, next) {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isTeamAdmin || req.user.role === "Platform Super Admin";

    const channels = isAdmin
      ? await channelService.getAllChannels(teamId)
      : await channelService.getChannelsForUser({ teamId, userId });

    return res.status(200).json({ success: true, data: channels });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/teams/:teamId/channels
 * Create a new channel. Only Team Admins can do this.
 */
export async function createChannelController(req, res, next) {
  try {
    const { teamId } = req.params;
    const createdBy = req.user.id;
    const { name, topic, memberIds = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Channel name is required." });
    }

    const channel = await channelService.createChannel({
      teamId,
      name: name.trim(),
      topic,
      createdBy,
      memberIds,
    });

    return res.status(201).json({ success: true, data: channel });
  } catch (error) {
    // Duplicate key — name already taken in this team
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A channel with that name already exists in this team.",
      });
    }
    next(error);
  }
}

/**
 * POST /api/teams/:teamId/channels/:channelId/members
 * Add members to a channel. Only Team Admins can do this.
 */
export async function addMembersController(req, res, next) {
  try {
    const { teamId, channelId } = req.params;
    const { memberIds = [] } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: "memberIds array is required." });
    }

    const channel = await channelService.addMembersToChannel({ channelId, teamId, memberIds });

    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found." });
    }

    return res.status(200).json({ success: true, data: channel });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/teams/:teamId/channels/:channelId
 * Delete a channel. Only Team Admins can do this. Default channels cannot be deleted.
 */
export async function deleteChannelController(req, res, next) {
  try {
    const { teamId, channelId } = req.params;

    const deleted = await channelService.deleteChannel({ channelId, teamId });

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "Channel not found or the default #general channel cannot be deleted.",
      });
    }

    return res.status(200).json({ success: true, message: "Channel deleted." });
  } catch (error) {
    next(error);
  }
}
