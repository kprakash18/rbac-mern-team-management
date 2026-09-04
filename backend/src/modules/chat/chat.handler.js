import mongoose from "mongoose";
import {
  saveChatMessage,
  getTeamChatHistory,
  editChatMessage,
  deleteChatMessage,
} from "./chat.service.js";
import { getMembership, hasValidDirectGrant } from "../authorization/authorization.service.js";
import { emitToUser } from "../../realtime/event-emitter.js";
import { createNotification } from "../notifications/notification.service.js";
import Membership from "../memberships/membership.model.js";
import User from "../users/user.model.js";

async function resolveToUserId(rawId) {
  if (!rawId) return null;
  const strId = String(rawId);
  if (!mongoose.Types.ObjectId.isValid(strId)) return strId;

  const isUser = await User.exists({ _id: strId });
  if (isUser) return strId;

  const membership = await Membership.findById(strId).select("userId");
  if (membership && membership.userId) {
    return String(membership.userId);
  }

  return strId;
}

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

      const { teamId, groupId = "grp-general", content } = data || {};

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
        groupId: groupId || "grp-general",
        senderId: user.id,
        content,
      });

      const messagePayload = {
        _id: message._id,
        teamId: message.teamId,
        groupId: message.groupId || "grp-general",
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
      const { teamId, groupId = "grp-general", limit = 50, before = null } = data || {};

      if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return respond({ ok: false, error: "Invalid team ID format." });
      }

      const hasAccess = await verifyUserTeamAccess(user.id, teamId);
      if (!hasAccess) {
        return respond({ ok: false, error: "Forbidden: You cannot view chat history for this team." });
      }

      const result = await getTeamChatHistory({ teamId, groupId: groupId || "grp-general", limit, before });

      respond({ ok: true, ...result });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      respond({ ok: false, error: "Failed to fetch chat history." });
    }
  });

  // 3. Typing Indicators
  socket.on("chat:typing", async (data) => {
    const { teamId, groupId = "grp-general", isTyping } = data || {};
    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) return;

    socket.to(`team:${teamId}`).emit("chat:typing", {
      teamId,
      groupId: groupId || "grp-general",
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

  // 6. Channel / Group Creation Notification & Broadcast
  socket.on("chat:group_create", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};
    try {
      const { teamId, group } = data || {};
      if (!teamId || !group) return respond({ ok: false });

      io.to(`team:${teamId}`).emit("chat:group_created", { teamId, group });

      const memberIds = Array.isArray(group.memberIds) ? group.memberIds : [];
      for (const rawMemberId of memberIds) {
        const resolvedUserId = await resolveToUserId(rawMemberId);
        if (resolvedUserId && String(resolvedUserId) !== String(user.id)) {
          createNotification({
            recipientId: resolvedUserId,
            actorId: user.id,
            type: "CHANNEL_ADDED",
            teamId,
            resourceType: "CHANNEL",
            resourceId: group.id,
            metadata: {
              groupId: group.id,
              channelName: group.name,
              actorName: user.name,
            },
            title: "Added to Channel",
            message: `You were added to channel #${group.name} by ${user.name}.`,
          }).catch((err) => console.error("Failed to persist notification:", err));
        }
      }

      respond({ ok: true });
    } catch (err) {
      console.error("Error in chat:group_create:", err);
      respond({ ok: false });
    }
  });

  // 7. Channel / Group Members Added Notification & Broadcast
  socket.on("chat:group_members_add", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};
    try {
      const { teamId, groupId, groupName, addedUserIds } = data || {};
      if (!teamId || !groupId) return respond({ ok: false });

      io.to(`team:${teamId}`).emit("chat:group_members_added", {
        teamId,
        groupId,
        addedUserIds,
      });

      const memberIds = Array.isArray(addedUserIds) ? addedUserIds : [];
      for (const rawMemberId of memberIds) {
        const resolvedUserId = await resolveToUserId(rawMemberId);
        if (resolvedUserId && String(resolvedUserId) !== String(user.id)) {
          createNotification({
            recipientId: resolvedUserId,
            actorId: user.id,
            type: "CHANNEL_ADDED",
            teamId,
            resourceType: "CHANNEL",
            resourceId: groupId,
            metadata: {
              groupId,
              channelName: groupName || "channel",
              actorName: user.name,
            },
            title: "Added to Channel",
            message: `You were added to channel #${groupName || "channel"} by ${user.name}.`,
          }).catch((err) => console.error("Failed to persist notification:", err));
        }
      }

      respond({ ok: true });
    } catch (err) {
      console.error("Error in chat:group_members_add:", err);
      respond({ ok: false });
    }
  });
}