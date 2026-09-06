import { io } from 'socket.io-client';

let socketInstance = null;

export function connectSocket(token) {
  if (socketInstance?.connected) return;

  const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
  socketInstance = io(socketUrl, {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    transports: ['websocket', 'polling'],
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected:', socketInstance.id);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('[Socket] Disconnected by client (logout).');
  }
}

export function getSocket() {
  return socketInstance;
}
