import { getIO } from "./socket.server.js";

export function emitToTeam(teamId, event, payload) {
  try {
    const io = getIO();
    io.to(`team:${teamId.toString()}`).emit(event, payload);
  } catch (error) {}
}

export function emitToUser(userId, event, payload) {
  try {
    const io = getIO();
    io.to(`user:${userId.toString()}`).emit(event, payload);
  } catch (error) {}
}

export function disconnectUserSockets(userId) {
  try {
    const io = getIO();
    io.in(`user:${userId.toString()}`).disconnectSockets(true);
  } catch (error) {}
}

