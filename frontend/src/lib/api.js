import axios from 'axios';
import { getStorage, removeStorage } from './storage';

const STORAGE_KEYS = {
  AUTH: 'auth_session',
  WORKSPACE: 'active_workspace',
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeStorage(STORAGE_KEYS.AUTH);
      removeStorage(STORAGE_KEYS.WORKSPACE);
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
