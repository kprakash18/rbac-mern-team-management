import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkspaceContext } from './WorkspaceContext.js';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useApp } from './useApp';

/**
 * WorkspaceProvider wraps any component subtree scoped to a specific team workspace.
 * It uses GET /api/teams/:teamId/bootstrap to deliver complete workspace state in 1 round-trip:
 *  - Workspace metadata & role definitions
 *  - Effective permission keys for current user
 *  - Active JIT access grants
 *  - Workspace telemetry & sprint statistics
 *
 * It subscribes to team-level Socket.IO events to automatically invalidate and
 * re-sync permissions, grants, and stats in real time with zero UI flicker.
 */
export function WorkspaceProvider({ teamId, children }) {
  const { authUser, isSuperAdmin } = useApp();

  const [bootstrapData, setBootstrapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBootstrap = useCallback(
    async (isBackground = false) => {
      if (!teamId || !authUser?.token) {
        setLoading(false);
        return;
      }

      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await api.get(`/api/teams/${teamId}/bootstrap`);
        if (response.data?.success && response.data?.data) {
          setBootstrapData(response.data.data);
        }
      } catch (err) {
        console.warn(`[WorkspaceBootstrap] Error fetching bootstrap for team ${teamId}:`, err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to load workspace bootstrap');
      } finally {
        setLoading(false);
      }
    },
    [teamId, authUser?.token]
  );

  // Initial fetch whenever teamId changes
  useEffect(() => {
    fetchBootstrap(false);
  }, [fetchBootstrap]);

  // Real-time socket synchronization on team room events
  useEffect(() => {
    if (!teamId) return;
    const socket = getSocket();
    if (!socket) return;

    // Join team socket room
    socket.emit('team:join', { teamId });

    // Events that alter authorization, roles, JIT grants, or membership
    const handleAuthorizationInvalidation = () => {
      fetchBootstrap(true);
    };

    socket.on('access:changed', handleAuthorizationInvalidation);
    socket.on('role:assigned', handleAuthorizationInvalidation);
    socket.on('access_grant:created', handleAuthorizationInvalidation);
    socket.on('access_grant:revoked', handleAuthorizationInvalidation);
    socket.on('access_request:approved', handleAuthorizationInvalidation);
    socket.on('member:joined', handleAuthorizationInvalidation);
    socket.on('member:removed', handleAuthorizationInvalidation);

    return () => {
      socket.off('access:changed', handleAuthorizationInvalidation);
      socket.off('role:assigned', handleAuthorizationInvalidation);
      socket.off('access_grant:created', handleAuthorizationInvalidation);
      socket.off('access_grant:revoked', handleAuthorizationInvalidation);
      socket.off('access_request:approved', handleAuthorizationInvalidation);
      socket.off('member:joined', handleAuthorizationInvalidation);
      socket.off('member:removed', handleAuthorizationInvalidation);
      socket.emit('team:leave', { teamId });
    };
  }, [teamId, fetchBootstrap]);

  const workspace = bootstrapData?.workspace || null;
  const roles = useMemo(() => bootstrapData?.roles || [], [bootstrapData?.roles]);
  const permissions = useMemo(() => bootstrapData?.permissions || [], [bootstrapData?.permissions]);
  const activeGrants = useMemo(() => bootstrapData?.activeGrants || [], [bootstrapData?.activeGrants]);
  const stats = useMemo(
    () =>
      bootstrapData?.stats || {
        totalMembers: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        activeJitGrants: 0,
        pendingJitRequests: 0,
      },
    [bootstrapData?.stats]
  );

  /**
   * Evaluates if the current user can perform an action in this workspace.
   * Conforms to the backend 4-layer authorization model:
   *  1. Platform Super Admin -> ALLOW
   *  2. Wildcard or Exact Role Permission -> ALLOW
   *  3. Active, unexpired JIT Access Grant -> ALLOW
   *  4. Resource context / ownership (if provided) -> ALLOW
   */
  const can = useCallback(
    (action, options = {}) => {
      if (isSuperAdmin) return true;

      // Check wildcard
      if (permissions.includes('*')) return true;

      // Check exact permission
      if (permissions.includes(action)) return true;

      // Check domain wildcard (e.g. "task.*" matching "task.create")
      const [domain] = (action || '').split('.');
      if (domain && permissions.includes(`${domain}.*`)) return true;

      // Check active JIT grants
      const now = new Date();
      const hasActiveJitGrant = activeGrants.some((grant) => {
        const key = grant.permissionKey || grant.permission;
        const isNotExpired = !grant.expiresAt || new Date(grant.expiresAt) > now;
        return (key === action || key === '*' || key === `${domain}.*`) && isNotExpired;
      });
      if (hasActiveJitGrant) return true;

      // Ownership fallback (e.g. updating a task assigned to me)
      if (options.isOwner) return true;

      return false;
    },
    [isSuperAdmin, permissions, activeGrants]
  );

  const value = useMemo(
    () => ({
      teamId,
      workspace,
      roles,
      permissions,
      activeGrants,
      stats,
      loading,
      error,
      refetchBootstrap: fetchBootstrap,
      can,
    }),
    [teamId, workspace, roles, permissions, activeGrants, stats, loading, error, fetchBootstrap, can]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
