import mongoose from "mongoose";
import {
  saveChatMessage,
  getTeamChatHistory,
  editChatMessage,
  deleteChatMessage,
} from "../modules/chat/chat.service.js";
import { getMembership, hasValidDirectGrant } from "../modules/authorization/authorization.service.js";

async function verifyUserTeamAccess(userId, teamId) {
  const isMember = await getMembership(userId, teamId);
  if (isMember) return true;

  return hasValidDirectGrant({
    userId,
    teamId,
    permissionKey: "team.read",
  });
}

export function registerChatHandlers(io, socket) {
  const user = socket.data.user;
  const messageTimestamps = [];

  // Simple sliding-window rate limiter (10 messages per 3 seconds per socket)
  function isRateLimited() {
    const now = Date.now();
    while (messageTimestamps.length > 0 && messageTimestamps[0] < now - 3000) {
      messageTimestamps.shift();
    }
    if (messageTimestamps.length >= 10) {
      return true;
    }
    messageTimestamps.push(now);
    return false;
  }

  // 1. Send Message
  socket.on("chat:send", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      if (isRateLimited()) {
        return respond({ ok: false, error: "Too many messages. Please slow down." });
      }

      const { teamId, content } = data || {};

      if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return respond({ ok: false, error: "Invalid team ID format." });
      }

      if (
        typeof content !== "string" ||
        content.trim().length < 1 ||
        content.trim().length > 2000
      ) {
        return respond({
          ok: false,
          error: "Message content cannot be empty or exceed 2000 chars.",
        });
      }

      const hasAccess = await verifyUserTeamAccess(user.id, teamId);
      if (!hasAccess) {
        return respond({ ok: false, error: "Forbidden: You are not authorized to chat in this team." });
      }

      const message = await saveChatMessage({
        teamId,
        senderId: user.id,
        content,
      });

      const messagePayload = {
        _id: message._id,
        teamId: message.teamId,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        content: message.content,
        messageType: message.messageType,
        isEdited: message.isEdited || false,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };

      io.to(`team:${teamId}`).emit("chat:message", messagePayload);

      respond({ ok: true, message: messagePayload });
    } catch (error) {
      console.error("Error in chat:send:", error);
      respond({ ok: false, error: "Failed to send message." });
    }
  });

  // 2. Fetch Chat History (Cursor-based)
  socket.on("chat:history", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      const { teamId, limit = 50, before = null } = data || {};

      if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return respond({ ok: false, error: "Invalid team ID format." });
      }

      const hasAccess = await verifyUserTeamAccess(user.id, teamId);
      if (!hasAccess) {
        return respond({ ok: false, error: "Forbidden: You cannot view chat history for this team." });
      }

      const result = await getTeamChatHistory({ teamId, limit, before });

      respond({ ok: true, ...result });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      respond({ ok: false, error: "Failed to fetch chat history." });
    }
  });

  // 3. Typing Indicators
  socket.on("chat:typing", async (data) => {
    const { teamId, isTyping } = data || {};
    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) return;

    socket.to(`team:${teamId}`).emit("chat:typing", {
      userId: user.id,
      name: user.name,
      isTyping: Boolean(isTyping),
    });
  });

  // 4. Edit Message
  socket.on("chat:edit", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      const { teamId, messageId, content } = data || {};

      if (!teamId || !messageId || typeof content !== "string" || content.trim().length < 1) {
        return respond({ ok: false, error: "Invalid edit parameters." });
      }

      const updatedMessage = await editChatMessage({
        messageId,
        senderId: user.id,
        content,
      });

      if (!updatedMessage) {
        return respond({ ok: false, error: "Message not found or you are not the author." });
      }

      io.to(`team:${teamId}`).emit("chat:message_updated", {
        messageId: updatedMessage._id,
        teamId,
        content: updatedMessage.content,
        isEdited: true,
        updatedAt: updatedMessage.updatedAt,
      });

      respond({ ok: true, message: updatedMessage });
    } catch (error) {
      console.error("Error in chat:edit:", error);
      respond({ ok: false, error: "Failed to edit message." });
    }
  });

  // 5. Delete Message
  socket.on("chat:delete", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      const { teamId, messageId } = data || {};

      if (!teamId || !messageId) {
        return respond({ ok: false, error: "Invalid delete parameters." });
      }

      const deleted = await deleteChatMessage({
        messageId,
        senderId: user.id,
      });

      if (!deleted) {
        return respond({ ok: false, error: "Message not found or unauthorized to delete." });
      }

      io.to(`team:${teamId}`).emit("chat:message_deleted", {
        messageId,
        teamId,
      });

      respond({ ok: true, messageId });
    } catch (error) {
      console.error("Error in chat:delete:", error);
      respond({ ok: false, error: "Failed to delete message." });
    }
  });
}