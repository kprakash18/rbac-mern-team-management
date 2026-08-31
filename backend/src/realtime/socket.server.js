import { registerChatHandlers } from "./chat.handler.js";
import { registerTeamRoomHandlers } from "./team-room.handler.js";
import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socket-auth.middleware.js";
import { env } from "../config/env.js";


let ioInstance = null;


export function initSocketServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientUrl || "*",
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;

    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);
    }
    registerTeamRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    socket.on("disconnect", (reason) => {
      console.log(`User ${userId || "Unknown"} disconnected (Socket ID: ${socket.id}). Reason: ${reason}`);
    });
  });

  ioInstance = io;
  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error(
      "Socket.IO server has not been initialized. Call initSocketServer(httpServer) first."
    );
  }
  return ioInstance;
}

export async function closeSocketServer() {
  if (ioInstance) {
    await new Promise((resolve) => {
      ioInstance.close(() => {
        resolve();
      });
    });
    ioInstance = null;
  }
}