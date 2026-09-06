import ChatChannel from "./chat-channel.model.js";

export async function ensureDefaultChannel(teamId) {
  const existing = await ChatChannel.findOne({ teamId, isDefault: true });
  if (existing) return existing;

  return ChatChannel.create({
    teamId,
    name: "general",
    topic: "Workspace general chat channel",
    isDefault: true,
    memberIds: [],
  });
}

export async function getChannelsForUser({ teamId, userId }) {
  await ensureDefaultChannel(teamId);

  const channels = await ChatChannel.find({
    teamId,
    isArchived: false,
    $or: [{ isDefault: true }, { memberIds: userId }],
  })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();

  return channels.map(formatChannel);
}

export async function getAllChannels(teamId) {
  await ensureDefaultChannel(teamId);

  const channels = await ChatChannel.find({ teamId, isArchived: false })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();

  return channels.map(formatChannel);
}

export async function createChannel({ teamId, name, topic, createdBy, memberIds = [] }) {
  const formatted = name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/^-+|-+$/g, "");

  const channel = await ChatChannel.create({
    teamId,
    name: formatted,
    topic: topic?.trim() || "Team collaboration channel",
    createdBy,
    memberIds: [...new Set(memberIds.map(String))],
    isDefault: false,
  });

  return formatChannel(channel.toObject());
}

export async function addMembersToChannel({ channelId, teamId, memberIds }) {
  const channel = await ChatChannel.findOneAndUpdate(
    { _id: channelId, teamId },
    { $addToSet: { memberIds: { $each: memberIds } } },
    { new: true }
  );

  if (!channel) return null;
  return formatChannel(channel.toObject());
}

export async function deleteChannel({ channelId, teamId }) {
  const channel = await ChatChannel.findOne({ _id: channelId, teamId });
  if (!channel || channel.isDefault) return false;

  await ChatChannel.deleteOne({ _id: channelId, teamId });
  return true;
}

export async function getChannelById({ channelId, teamId }) {
  const channel = await ChatChannel.findOne({ _id: channelId, teamId }).lean();
  if (!channel) return null;
  return formatChannel(channel);
}

function formatChannel(ch) {
  return {
    _id: ch._id,
    id: ch._id,
    teamId: ch.teamId,
    name: ch.name,
    topic: ch.topic || "",
    createdBy: ch.createdBy,
    memberIds: (ch.memberIds || []).map(String),
    isDefault: ch.isDefault,
    isArchived: ch.isArchived,
    createdAt: ch.createdAt,
    updatedAt: ch.updatedAt,
  };
}
