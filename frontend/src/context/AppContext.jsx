import { useState, useCallback, useEffect } from 'react';
import { AppContext } from './AppContext.js';
import { getStorage, setStorage, removeStorage } from '../lib/storage';
import { connectSocket, disconnectSocket } from '../lib/socket';
import api from '../lib/api';

const STORAGE_KEYS = {
  AUTH: 'auth_session',
  WORKSPACE: 'active_workspace',
};

const SUPER_ADMIN_ROLE = 'Platform Super Admin';

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(() => getStorage(STORAGE_KEYS.AUTH));
  const [activeWorkspace, setActiveWorkspace] = useState(() => getStorage(STORAGE_KEYS.WORKSPACE));

  // Re-validate session with backend on app load and sync fresh user profile
  useEffect(() => {
    async function validateAndSyncSession() {
      const storedSession = getStorage(STORAGE_KEYS.AUTH);
      if (!storedSession?.token) return;

      connectSocket(storedSession.token);

      try {
        const response = await api.get('/api/auth/me');
        const dbUser = response.data?.data?.user;
        if (dbUser) {
          const syncedUser = {
            ...storedSession,
            ...dbUser,
            role:
              dbUser.email === 'admin@system.local' || dbUser.email === 'admin@platform.internal'
                ? 'Platform Super Admin'
                : dbUser.role || storedSession.role || 'Member',
          };
          setStorage(STORAGE_KEYS.AUTH, syncedUser);
          setAuthUser(syncedUser);
        }
      } catch (error) {
        console.warn('[Auth] Session validation error:', error.message);
      }
    }

    validateAndSyncSession();
  }, []);

  /**
   * Called after a successful login API response.
   * Persists the session and connects the Socket.IO client.
   * @param {{ token: string, ...user }} user - response from POST /api/auth/login
   */
  const login = useCallback((user) => {
    setStorage(STORAGE_KEYS.AUTH, user);
    setAuthUser(user);
    // Connect socket immediately after login so real-time events work
    if (user?.token) {
      connectSocket(user.token);
    }
  }, []);

  /**
   * Clears all session state and tears down the socket connection.
   * Fires POST /api/auth/logout on the backend.
   */
  const logout = useCallback(async () => {
    try {
      if (authUser?.token) {
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.warn('Backend logout API call failed:', err.message);
    } finally {
      disconnectSocket();
      removeStorage(STORAGE_KEYS.AUTH);
      removeStorage(STORAGE_KEYS.WORKSPACE);
      setAuthUser(null);
      setActiveWorkspace(null);
    }
  }, [authUser]);

  /**
   * Updates the cached user object (e.g. after forced password change).
   * Does NOT reconnect the socket — token remains the same.
   */
  const updateAuthUser = useCallback((updatedUser) => {
    setStorage(STORAGE_KEYS.AUTH, updatedUser);
    setAuthUser(updatedUser);
  }, []);

  /**
   * Called when the user selects a workspace.
   * Phase 8 will also emit team:join here.
   */
  const selectWorkspace = useCallback((workspace) => {
    setStorage(STORAGE_KEYS.WORKSPACE, workspace);
    setActiveWorkspace(workspace);
  }, []);

  /**
   * Called when a Super Admin exits a workspace they jumped into.
   * Phase 8 will also emit team:leave here.
   */
  const clearWorkspace = useCallback(() => {
    removeStorage(STORAGE_KEYS.WORKSPACE);
    setActiveWorkspace(null);
  }, []);

  const isSuperAdmin =
    authUser?.role === SUPER_ADMIN_ROLE ||
    authUser?.email === 'admin@system.local' ||
    authUser?.email === 'admin@platform.internal';

  return (
    <AppContext.Provider
      value={{
        authUser,
        activeWorkspace,
        isSuperAdmin,
        login,
        logout,
        updateAuthUser,
        selectWorkspace,
        clearWorkspace,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

