import axios from 'axios';
import { getStorage, removeStorage } from './storage';

const STORAGE_KEYS = {
  AUTH: 'auth_session',
  WORKSPACE: 'active_workspace',
};

/**
 * Axios instance pre-configured with the backend base URL.
 * All requests automatically attach the JWT Bearer token from storage.
 * A 401 response clears the session and reloads to the login screen.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach Bearer token and active team context to every outgoing request if available.
api.interceptors.request.use((config) => {
  const session = getStorage(STORAGE_KEYS.AUTH);
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  const activeWorkspace = getStorage(STORAGE_KEYS.WORKSPACE);
  const activeTeamId = activeWorkspace?._id || activeWorkspace?.id;
  if (activeTeamId && !config.headers['x-team-id']) {
    config.headers['x-team-id'] = activeTeamId;
  }

  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On 401 for authenticated endpoints: session is expired or invalid → wipe state and force re-login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/api/auth/login');
    const isVerifyEndpoint = error.config?.url?.includes('/api/invitations/verify');
    if (error.response?.status === 401 && !isLoginEndpoint && !isVerifyEndpoint) {
      removeStorage(STORAGE_KEYS.AUTH);
      removeStorage(STORAGE_KEYS.WORKSPACE);
      // Hard reload sends user back to LoginPage if on a protected route
      if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/invite')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
