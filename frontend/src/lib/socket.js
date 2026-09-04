import { io } from 'socket.io-client';

/**
 * Socket.IO client singleton.
 *
 * Lifecycle:
 *  - connectSocket(token) — called inside AppContext.login()
 *  - disconnectSocket()   — called inside AppContext.logout()
 *  - getSocket()          — used in components to emit/listen
 *
 * The socket authenticates via the JWT token passed as `auth.token`.
 * The backend socketAuthMiddleware validates it on the handshake.
 */

let socketInstance = null;

/**
 * Connect to the Socket.IO server.
 * Safe to call multiple times — will not create duplicate connections.
 * @param {string} token - JWT access token
 */
export function connectSocket(token) {
  if (socketInstance?.connected) return;

  socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    // Reconnect up to 5 times with exponential backoff
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

/**
 * Disconnect and destroy the current socket connection.
 * Called on logout.
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('[Socket] Disconnected by client (logout).');
  }
}

/**
 * Returns the active socket instance.
 * Components use this to emit events and attach listeners.
 * @returns {import('socket.io-client').Socket | null}
 */
export function getSocket() {
  return socketInstance;
}
