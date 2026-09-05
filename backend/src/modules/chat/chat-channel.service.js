import ChatChannel from "./chat-channel.model.js";

/**
 * Ensure the default #general channel exists for a team.
 * Idempotent — safe to call multiple times.
 */
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

/**
 * Get all channels visible to a user in a team:
 *   - All default channels (e.g. #general)
 *   - Non-default channels where the user is a member
 */
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

/**
 * Get all channels for a team (admin view — no member filter).
 */
export async function getAllChannels(teamId) {
  await ensureDefaultChannel(teamId);

  const channels = await ChatChannel.find({ teamId, isArchived: false })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();

  return channels.map(formatChannel);
}

/**
 * Create a new channel for a team.
 * Throws if the name already exists in the team.
 */
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

/**
 * Add members to an existing channel.
 */
export async function addMembersToChannel({ channelId, teamId, memberIds }) {
  const channel = await ChatChannel.findOneAndUpdate(
    { _id: channelId, teamId },
    { $addToSet: { memberIds: { $each: memberIds } } },
    { new: true }
  );

  if (!channel) return null;
  return formatChannel(channel.toObject());
}

/**
 * Delete a channel (non-default only).
 * Returns true if deleted, false if not found or is default.
 */
export async function deleteChannel({ channelId, teamId }) {
  const channel = await ChatChannel.findOne({ _id: channelId, teamId });
  if (!channel || channel.isDefault) return false;

  await ChatChannel.deleteOne({ _id: channelId, teamId });
  return true;
}

/**
 * Get a single channel by ID.
 */
export async function getChannelById({ channelId, teamId }) {
  const channel = await ChatChannel.findOne({ _id: channelId, teamId }).lean();
  if (!channel) return null;
  return formatChannel(channel);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatChannel(ch) {
  return {
    _id: ch._id,
    id: ch._id,               // frontend compatibility alias
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
