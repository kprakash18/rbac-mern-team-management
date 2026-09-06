import mongoose from "mongoose";
import { getMembership, isSuperAdmin, can } from "../authorization/authorization.service.js";

export function registerTeamRoomHandlers(io, socket) {
  const user = socket.data.user;

  socket.on("team:join", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      const { teamId } = data || {};

      if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return respond({ ok: false, error: "Invalid team ID format." });
      }

      const activeMembership = await getMembership(user.id, teamId);
      const userIsSuperAdmin = user.isSuperAdmin || (await isSuperAdmin(user.id));

      if (!activeMembership && !userIsSuperAdmin) {
        return respond({ ok: false, error: "Forbidden: Active workspace membership required to join team room." });
      }

      const roomName = `team:${teamId}`;
      socket.join(roomName);

      socket.to(roomName).emit("team:member_joined", {
        userId: user.id,
        name: user.name,
        email: user.email,
        isTemporary: false,
      });

      respond({ ok: true, room: roomName, isTemporary: false });
    } catch (error) {
      console.error("Error in team:join:", error);
      respond({ ok: false, error: "Internal server error while joining room." });
    }
  });

  // Resource-Level Room: task:join (supports both regular members and JIT grant holders)
  socket.on("task:join", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      const { taskId, teamId } = data || {};
      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId) || !teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return respond({ ok: false, error: "Invalid task or team ID." });
      }

      const hasTaskAccess = await can(user.id, teamId, "task.read", taskId);
      if (!hasTaskAccess) {
        return respond({ ok: false, error: "Forbidden: You do not have access to this task." });
      }

      const roomName = `task:${taskId}`;
      socket.join(roomName);
      respond({ ok: true, room: roomName });
    } catch (error) {
      console.error("Error in task:join:", error);
      respond({ ok: false, error: "Failed to join task room." });
    }
  });

  socket.on("task:leave", (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};
    const { taskId } = data || {};
    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      socket.leave(`task:${taskId}`);
    }
    respond({ ok: true });
  });

  socket.on("team:leave", (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};
    const { teamId } = data || {};

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return respond({ ok: false, error: "Invalid team ID format." });
    }

    const roomName = `team:${teamId}`;
    socket.leave(roomName);

    socket.to(roomName).emit("team:member_left", {
      userId: user.id,
      name: user.name,
    });

    respond({ ok: true, room: roomName });
  });
}

