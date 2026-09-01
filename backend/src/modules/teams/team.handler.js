import mongoose from "mongoose";
import { getMembership } from "../authorization/authorization.service.js";
import { getActiveTemporaryGrant } from "../access/access.service.js";


const TEN_MINUTES_MS = 10 * 60 * 1000;

export function registerTeamRoomHandlers(io, socket) {
  const user = socket.data.user;
  const activeTimers = new Map();

  function clearRoomTimers(teamId) {
    if (activeTimers.has(teamId)) {
      const { warningTimer, expirationTimer } = activeTimers.get(teamId);
      clearTimeout(warningTimer);
      clearTimeout(expirationTimer);
      activeTimers.delete(teamId);
    }
  }

  socket.on("team:join", async (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};

    try {
      const { teamId } = data || {};

      if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return respond({ ok: false, error: "Invalid team ID format." });
      }

      const activeMembership = await getMembership(user.id, teamId);

      const activeGrant = activeMembership ? null : await getActiveTemporaryGrant({
        teamId,
        userId: user.id,
      });


      if (!activeMembership && !activeGrant) {
        return respond({ ok: false, error: "Forbidden: No active membership or temporary grant found." });
      }

      const roomName = `team:${teamId}`;
      socket.join(roomName);

      if (activeGrant) {
        clearRoomTimers(teamId);

        const totalRemainingMs = new Date(activeGrant.expiresAt).getTime() - Date.now();
        const warningDelayMs = totalRemainingMs - TEN_MINUTES_MS;

        let warningTimer = null;
        if (warningDelayMs > 0) {
          warningTimer = setTimeout(() => {
            socket.emit("team:access_warning", {
              teamId,
              minutesRemaining: 10,
              message: "Your temporary team access will expire in 10 minutes.",
            });
          }, warningDelayMs);
        } else {
          const minsLeft = Math.max(1, Math.round(totalRemainingMs / (60 * 1000)));
          socket.emit("team:access_warning", {
            teamId,
            minutesRemaining: minsLeft,
            message: `Notice: Your temporary team access will expire in ${minsLeft} minute(s).`,
          });
        }

        const expirationTimer = setTimeout(() => {
          socket.leave(roomName);
          clearRoomTimers(teamId);

          socket.emit("team:access_expired", {
            teamId,
            message: "Your temporary team access has expired. You have been removed from the team room.",
          });

          socket.to(roomName).emit("team:member_left", {
            userId: user.id,
            name: user.name,
            reason: "ACCESS_EXPIRED",
          });
        }, totalRemainingMs);

        activeTimers.set(teamId, { warningTimer, expirationTimer });
      }

      socket.to(roomName).emit("team:member_joined", {
        userId: user.id,
        name: user.name,
        email: user.email,
        isTemporary: !activeMembership,
      });

      respond({ ok: true, room: roomName, isTemporary: !activeMembership });
    } catch (error) {
      console.error("Error in team:join:", error);
      respond({ ok: false, error: "Internal server error while joining room." });
    }
  });

  socket.on("team:leave", (data, callback) => {
    const respond = typeof callback === "function" ? callback : () => {};
    const { teamId } = data || {};

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return respond({ ok: false, error: "Invalid team ID format." });
    }

    clearRoomTimers(teamId);
    const roomName = `team:${teamId}`;
    socket.leave(roomName);

    socket.to(roomName).emit("team:member_left", {
      userId: user.id,
      name: user.name,
    });

    respond({ ok: true, room: roomName });
  });

  socket.on("disconnect", () => {
    for (const teamId of activeTimers.keys()) {
      clearRoomTimers(teamId);
    }
  });
}
