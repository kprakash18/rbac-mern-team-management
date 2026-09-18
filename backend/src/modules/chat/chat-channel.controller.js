import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendCreated, sendSuccess } from "../../common/http/response.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../common/errors/index.js";
import { can } from "../authorization/authorization.service.js";
import * as channelService from "./chat-channel.service.js";

export const getChannelsController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  const isAdmin = Boolean(
    req.context?.isSuperAdmin ||
    req.user.isSuperAdmin ||
    (await can(userId, teamId, "membership.read")) ||
    (await can(userId, teamId, "team.update"))
  );

  const channels = isAdmin
    ? await channelService.getAllChannels(teamId)
    : await channelService.getChannelsForUser({ teamId, userId });

  sendSuccess(res, { data: channels });
});

export const createChannelController = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;
  const createdBy = req.user.id;
  const { name, topic, memberIds = [] } = req.body;

  if (!name || !name.trim()) {
    throw new BadRequestError("Channel name is required.", "CHANNEL_NAME_REQUIRED");
  }

  try {
    const channel = await channelService.createChannel({
      teamId,
      name: name.trim(),
      topic,
      createdBy,
      memberIds,
    });
    sendCreated(res, { data: channel });
  } catch (error) {
    if (error.code === 11000) {
      throw new ConflictError(
        "A channel with that name already exists in this team.",
        "CHANNEL_NAME_CONFLICT"
      );
    }
    next(error);
  }
});

export const addMembersController = asyncHandler(async (req, res) => {
  const { teamId, channelId } = req.params;
  const { memberIds = [] } = req.body;

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new BadRequestError("memberIds array is required.", "MEMBER_IDS_REQUIRED");
  }

  const channel = await channelService.addMembersToChannel({ channelId, teamId, memberIds });
  if (!channel) {
    throw new NotFoundError("Channel not found.", "CHANNEL_NOT_FOUND");
  }

  sendSuccess(res, { data: channel });
});

export const deleteChannelController = asyncHandler(async (req, res) => {
  const { teamId, channelId } = req.params;
  const deleted = await channelService.deleteChannel({ channelId, teamId });

  if (!deleted) {
    throw new BadRequestError(
      "Channel not found or the default #general channel cannot be deleted.",
      "CHANNEL_DELETE_NOT_ALLOWED"
    );
  }

  sendSuccess(res, { message: "Channel deleted." });
});
