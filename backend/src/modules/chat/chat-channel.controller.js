import { asyncHandler } from "../../common/utils/async-handler.js";
import * as channelService from "./chat-channel.service.js";

export const getChannelsController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.isTeamAdmin || req.user.role === "Platform Super Admin";

  const channels = isAdmin
    ? await channelService.getAllChannels(teamId)
    : await channelService.getChannelsForUser({ teamId, userId });

  res.status(200).json({ success: true, data: channels });
});

export const createChannelController = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;
  const createdBy = req.user.id;
  const { name, topic, memberIds = [] } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Channel name is required." });
  }

  try {
    const channel = await channelService.createChannel({
      teamId,
      name: name.trim(),
      topic,
      createdBy,
      memberIds,
    });
    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A channel with that name already exists in this team.",
      });
    }
    next(error);
  }
});

export const addMembersController = asyncHandler(async (req, res) => {
  const { teamId, channelId } = req.params;
  const { memberIds = [] } = req.body;

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ success: false, message: "memberIds array is required." });
  }

  const channel = await channelService.addMembersToChannel({ channelId, teamId, memberIds });
  if (!channel) {
    return res.status(404).json({ success: false, message: "Channel not found." });
  }

  res.status(200).json({ success: true, data: channel });
});

export const deleteChannelController = asyncHandler(async (req, res) => {
  const { teamId, channelId } = req.params;
  const deleted = await channelService.deleteChannel({ channelId, teamId });

  if (!deleted) {
    return res.status(400).json({
      success: false,
      message: "Channel not found or the default #general channel cannot be deleted.",
    });
  }

  res.status(200).json({ success: true, message: "Channel deleted." });
});
