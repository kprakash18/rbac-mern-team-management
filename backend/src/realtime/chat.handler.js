import mongoose from "mongoose";
import ChatMessage from "../modules/chat/chat-message.model.js";
import Membership from "../modules/memberships/membership.model.js";
import AccessGrant from "../modules/access/access-grant.model.js";

export function registerChatHandlers(io, socket) {
  const user = socket.data.user;

  socket.on("chat:send", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
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

      const isMember = await Membership.findOne({ teamId, userId: user.id, status: "ACTIVE" });
      const hasGrant = isMember ? true : await AccessGrant.findOne({
        teamId,
        userId: user.id,
        status: "ACTIVE",
        expiresAt: { $gt: new Date() },
      });

      if (!isMember && !hasGrant) {
        return respond({ ok: false, error: "Forbidden: You are not authorized to chat in this team." });
      }

      const message = await ChatMessage.create({
        teamId,
        senderId: user.id,
        content: content.trim(),
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
        createdAt: message.createdAt,
      };

      io.to(`team:${teamId}`).emit("chat:message", messagePayload);

      respond({ ok: true, message: messagePayload });
    } catch (error) {
      console.error("Error in chat:send:", error);
      respond({ ok: false, error: "Failed to send message." });
    }
  });

  socket.on("chat:history", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      const { teamId, limit = 50 } = data || {};

      if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return respond({ ok: false, error: "Invalid team ID format." });
      }

      // Verify access
      const isMember = await Membership.findOne({ teamId, userId: user.id, status: "ACTIVE" });
      const hasGrant = isMember ? true : await AccessGrant.findOne({
        teamId,
        userId: user.id,
        status: "ACTIVE",
        expiresAt: { $gt: new Date() },
      });

      if (!isMember && !hasGrant) {
        return respond({ ok: false, error: "Forbidden: You cannot view chat history for this team." });
      }

      const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

      const rawMessages = await ChatMessage.find({ teamId })
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .populate("senderId", "_id name email")
        .lean();

      const messages = rawMessages.reverse().map((msg) => ({
        _id: msg._id,
        teamId: msg.teamId,
        sender: {
          id: msg.senderId?._id || msg.senderId,
          name: msg.senderId?.name || "Unknown",
          email: msg.senderId?.email || "",
        },
        content: msg.content,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
      }));

      respond({ ok: true, messages });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      respond({ ok: false, error: "Failed to fetch chat history." });
    }
  });
}