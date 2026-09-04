import ChatMessage from "./chat-message.model.js";

/**
 * 1. Persist a new chat message in MongoDB
 */
export async function saveChatMessage({ teamId, groupId = "grp-general", senderId, content, messageType = "TEXT" }) {
  const message = await ChatMessage.create({
    teamId,
    groupId: groupId || "grp-general",
    senderId,
    content: content.trim(),
    messageType,
  });

  return message;
}

/**
 * 2. Retrieve chat messages for a team and specific group/channel with cursor-based pagination
 */
export async function getTeamChatHistory({ teamId, groupId = "grp-general", limit = 50, before = null }) {
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const filter = { teamId, groupId: groupId || "grp-general" };
  if (before) {
    const beforeDate = new Date(before);
    if (!isNaN(beforeDate.getTime())) {
      filter.createdAt = { $lt: beforeDate };
    }
  }

  const rawMessages = await ChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .limit(sanitizedLimit + 1)
    .populate("senderId", "_id name email")
    .lean();

  const hasMore = rawMessages.length > sanitizedLimit;
  const slicedMessages = hasMore ? rawMessages.slice(0, sanitizedLimit) : rawMessages;

  const messages = slicedMessages.reverse().map((msg) => ({
    _id: msg._id,
    teamId: msg.teamId,
    groupId: msg.groupId || "grp-general",
    sender: {
      id: msg.senderId?._id || msg.senderId,
      name: msg.senderId?.name || "Unknown",
      email: msg.senderId?.email || "",
    },
    content: msg.content,
    messageType: msg.messageType,
    isEdited: msg.isEdited || false,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  }));

  const oldestCursor = messages.length > 0 ? messages[0].createdAt : null;

  return {
    messages,
    hasMore,
    oldestCursor,
  };
}

/**
 * 3. Edit a chat message (only by original sender)
 */
export async function editChatMessage({ messageId, senderId, content }) {
  const message = await ChatMessage.findOne({ _id: messageId, senderId });
  if (!message) return null;

  message.content = content.trim();
  message.isEdited = true;
  await message.save();

  return message;
}

/**
 * 4. Delete a chat message
 */
export async function deleteChatMessage({ messageId, senderId }) {
  const result = await ChatMessage.findOneAndDelete({ _id: messageId, senderId });
  return Boolean(result);
}

