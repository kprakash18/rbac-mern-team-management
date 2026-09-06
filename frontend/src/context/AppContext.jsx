import { useState, useCallback, useEffect } from 'react';
import { AppContext } from './AppContext.js';
import { getStorage, setStorage, removeStorage } from '../lib/storage.js';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket.js';
import api from '../lib/api.js';

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
          const isUserSuperAdmin = Boolean(
            dbUser.isSuperAdmin ||
            dbUser.role === 'Platform Super Admin' ||
            dbUser.roles?.includes('Super Admin') ||
            dbUser.roles?.includes('Platform Super Admin')
          );

          const syncedUser = {
            ...storedSession,
            ...dbUser,
            isSuperAdmin: isUserSuperAdmin,
            role: isUserSuperAdmin
              ? 'Platform Super Admin'
              : dbUser.role || storedSession.role || 'Member',
          };
          setStorage(STORAGE_KEYS.AUTH, syncedUser);
          setAuthUser(syncedUser);
        }
      } catch (error) {
        console.warn('[Auth] Session validation error:', error.message);
        const errCode = error.response?.data?.code || error.response?.data?.error?.code;
        if (errCode === 'ACCOUNT_SUSPENDED') {
          const suspendedUser = {
            ...storedSession,
            accountStatus: 'SUSPENDED',
            status: 'Suspended',
          };
          setStorage(STORAGE_KEYS.AUTH, suspendedUser);
          setAuthUser(suspendedUser);
        }
      }
    }

    validateAndSyncSession();
  }, []);

  // Auto-resolve and activate workspace if teamId is provided in URL query params
  useEffect(() => {
    async function resolveUrlWorkspace() {
      if (!authUser?.token) return;
      const urlParams = new URLSearchParams(window.location.search);
      const targetTeamId = urlParams.get('teamId') || urlParams.get('workspace');
      if (!targetTeamId) return;

      try {
        const res = await api.get(`/api/teams/${targetTeamId}`);
        const teamData = res.data?.data?.team || res.data?.data || res.data;
        if (teamData) {
          const formatted = {
            ...teamData,
            id: teamData._id || teamData.id,
            name: teamData.name,
            role: teamData.role || 'Developer',
            isTeamAdmin: Boolean(
              teamData.isTeamAdmin ||
              teamData.role === 'Team Admin' ||
              teamData.role?.toLowerCase().includes('admin')
            ),
            icon: teamData.icon || 'domain',
            iconBgColor: teamData.iconBgColor || 'bg-primary',
            iconTextColor: teamData.iconTextColor || 'text-on-primary',
          };
          setStorage(STORAGE_KEYS.WORKSPACE, formatted);
          setActiveWorkspace(formatted);
        }
      } catch (err) {
        console.warn('Could not auto-load team workspace from URL query:', err);
      }
    }

    resolveUrlWorkspace();
  }, [authUser]);

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
      sessionStorage.clear();
      setAuthUser(null);
      setActiveWorkspace(null);
      window.history.replaceState({}, document.title, '/');
      window.location.href = '/';
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

  const isSuperAdmin = Boolean(
    authUser?.isSuperAdmin ||
    authUser?.role === SUPER_ADMIN_ROLE ||
    authUser?.roles?.includes('Super Admin') ||
    authUser?.roles?.includes('Platform Super Admin')
  );

  const [workspacePermissions, setWorkspacePermissions] = useState([]);

  const refreshPermissions = useCallback(async () => {
    if (isSuperAdmin) {
      try {
        const res = await api.get('/api/permissions');
        const perms = res.data?.data?.permissions || res.data?.data || [];
        const allKeys = perms.map((p) => p.key).concat('*');
        setWorkspacePermissions(allKeys);
        return;
      } catch {
        setWorkspacePermissions(['*']);
        return;
      }
    }

    const teamId = activeWorkspace?._id || activeWorkspace?.id;
    if (!teamId || !authUser?.token) {
      setWorkspacePermissions([]);
      return;
    }
    try {
      const res = await api.get(`/api/authorization/permissions?teamId=${teamId}`);
      const perms = res.data?.data?.permissions || res.data?.data?.effectivePermissions || [];
      setWorkspacePermissions(perms);
    } catch (err) {
      console.warn('[Permissions] Failed to fetch workspace permissions:', err.message);
    }
  }, [isSuperAdmin, activeWorkspace?._id, activeWorkspace?.id, authUser?.token]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAccessUpdate = (data) => {
      const currentTeamId = activeWorkspace?._id || activeWorkspace?.id;
      if (!data?.teamId || String(data.teamId) === String(currentTeamId)) {
        refreshPermissions();
      }
    };

    socket.on('access:changed', handleAccessUpdate);
    socket.on('access_request:resolved', handleAccessUpdate);
    socket.on('role:assigned', handleAccessUpdate);
    socket.on('role:revoked', handleAccessUpdate);
    socket.on('team:permissions_updated', handleAccessUpdate);

    return () => {
      socket.off('access:changed', handleAccessUpdate);
      socket.off('access_request:resolved', handleAccessUpdate);
      socket.off('role:assigned', handleAccessUpdate);
      socket.off('role:revoked', handleAccessUpdate);
      socket.off('team:permissions_updated', handleAccessUpdate);
    };
  }, [activeWorkspace?._id, activeWorkspace?.id, refreshPermissions]);

  const hasPermission = useCallback((permKey) => {
    if (!permKey) return false;
    if (isSuperAdmin) return true;
    if (activeWorkspace?.isTeamAdmin || activeWorkspace?.role === 'Team Admin') return true;
    return workspacePermissions.includes(permKey) || workspacePermissions.includes('*');
  }, [isSuperAdmin, activeWorkspace, workspacePermissions]);

  return (
    <AppContext.Provider
      value={{
        authUser,
        activeWorkspace,
        isSuperAdmin,
        workspacePermissions,
        hasPermission,
        refreshPermissions,
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

