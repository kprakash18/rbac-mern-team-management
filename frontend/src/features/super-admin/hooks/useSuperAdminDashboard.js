import { useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { getSocket } from '@/lib/socket';

export function formatActivityItem(l) {
  const actorName = l.actor?.name || l.actorId?.name || 'System Admin';
  const initials = actorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SA';
  const timeStr = l.createdAt
    ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';
  return {
    id: l._id || l.id,
    time: timeStr,
    actor: {
      name: actorName,
      initials,
      isSystem: l.actor?.isSystem || false,
      isError: l.result === 'FAILURE' || l.result === 'FAILED',
    },
    action: l.action || 'system.event',
    target: l.targetId?.name || l.targetIdentifier || l.targetType || (l.teamId?.name ? `${l.teamId.name}` : 'System Resource'),
    result: (l.result || 'SUCCESS').toUpperCase(),
    resultType: (l.result || 'success').toLowerCase(),
  };
}

export function useSuperAdminDashboard() {
  const queryClient = useQueryClient();

  // 1. Workspaces Query (3 minutes staleTime)
  const {
    data: rawWorkspaces = [],
    isLoading: isWorkspacesLoading,
    refetch: refetchWorkspaces,
  } = useQuery({
    queryKey: queryKeys.superAdmin.workspaces(),
    queryFn: async () => {
      const res = await api.get('/api/teams?limit=50');
      return res.data?.data?.teams || res.data?.data || [];
    },
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
  });

  // 2. User Stats Query (5 minutes staleTime)
  const {
    data: userStats = {},
    isLoading: isStatsLoading,
  } = useQuery({
    queryKey: queryKeys.superAdmin.userStats(),
    queryFn: async () => {
      const res = await api.get('/api/users/stats');
      return res.data?.data || {};
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  // 3. Audit Logs Query (1 minute staleTime)
  const {
    data: rawAuditLogs = [],
    isLoading: isAuditLoading,
  } = useQuery({
    queryKey: queryKeys.superAdmin.auditLogs(20),
    queryFn: async () => {
      const res = await api.get('/api/audit-logs?limit=20');
      const data = res.data?.data;
      return Array.isArray(data) ? data : data?.logs || [];
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 15,
  });

  // 4. Access Requests / JIT Query (2 minutes staleTime)
  const {
    data: rawJitGrants = [],
    isLoading: isJitLoading,
  } = useQuery({
    queryKey: queryKeys.superAdmin.accessRequests(),
    queryFn: async () => {
      const res = await api.get('/api/access-requests');
      const data = res.data?.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });

  // Formatted Workspaces
  const workspaces = useMemo(() => {
    return rawWorkspaces.map((w) => ({
      ...w,
      id: w._id || w.id,
      name: w.name,
      description: w.description || 'Workspace',
      status: w.status === 'ACTIVE' ? 'Active' : w.status === 'ARCHIVED' ? 'Archived' : w.status || 'Active',
      membersCount: w.membersCount || 1,
      tier: w.tier || 'Standard RBAC',
    }));
  }, [rawWorkspaces]);

  // Formatted Activities
  const activities = useMemo(() => {
    return rawAuditLogs.map(formatActivityItem);
  }, [rawAuditLogs]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const activeWs = workspaces.filter((w) => w.status !== 'Archived').length;
    const archivedWs = workspaces.filter((w) => w.status === 'Archived').length;

    const totalU = userStats.total || 10000;
    const activeU = userStats.active || 0;
    const invitedU = userStats.invited || 0;
    const suspendedU = userStats.suspended || 0;

    const activeJitCount = rawJitGrants.filter(
      (j) => j.status === 'APPROVED' || j.status === 'ACTIVE'
    ).length;

    return {
      workspaces: { total: workspaces.length, active: activeWs, archived: archivedWs },
      users: { total: totalU, active: activeU, invited: invitedU, suspended: suspendedU },
      jitGrants: { active: activeJitCount, trending: `+${activeJitCount}`, percentage: '100%' },
      securityEvents: { today: rawAuditLogs.length, last24Hours: 'Live audit log stream' },
    };
  }, [workspaces, userStats, rawJitGrants, rawAuditLogs]);

  // Real-time WebSocket integration for audit logs
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewActivity = (newLog) => {
      queryClient.setQueryData(queryKeys.superAdmin.auditLogs(20), (prev = []) => {
        const id = newLog._id || newLog.id;
        const filtered = prev.filter((a) => (a._id || a.id) !== id);
        return [newLog, ...filtered].slice(0, 30);
      });
    };

    socket.on('audit:new', handleNewActivity);
    return () => {
      socket.off('audit:new', handleNewActivity);
    };
  }, [queryClient]);

  // Cache manipulation helpers for workspaces
  const createWorkspaceCache = useCallback(
    (newWs) => {
      queryClient.setQueryData(queryKeys.superAdmin.workspaces(), (prev = []) => [newWs, ...prev]);
    },
    [queryClient]
  );

  const updateWorkspaceCache = useCallback(
    (updatedWs) => {
      queryClient.setQueryData(queryKeys.superAdmin.workspaces(), (prev = []) =>
        prev.map((ws) => ((ws._id || ws.id) === (updatedWs._id || updatedWs.id) ? { ...ws, ...updatedWs } : ws))
      );
    },
    [queryClient]
  );

  const archiveWorkspaceCache = useCallback(
    (workspaceId) => {
      queryClient.setQueryData(queryKeys.superAdmin.workspaces(), (prev = []) =>
        prev.map((ws) =>
          (ws._id || ws.id) === workspaceId
            ? { ...ws, status: 'ARCHIVED', archivedAt: new Date().toISOString() }
            : ws
        )
      );
    },
    [queryClient]
  );

  const restoreWorkspaceCache = useCallback(
    (workspaceId) => {
      queryClient.setQueryData(queryKeys.superAdmin.workspaces(), (prev = []) =>
        prev.map((ws) =>
          (ws._id || ws.id) === workspaceId
            ? { ...ws, status: 'ACTIVE', archivedAt: null }
            : ws
        )
      );
    },
    [queryClient]
  );

  const loading = isWorkspacesLoading || isStatsLoading || isAuditLoading || isJitLoading;

  return {
    workspaces,
    activities,
    metrics,
    loading,
    refetchWorkspaces,
    createWorkspaceCache,
    updateWorkspaceCache,
    archiveWorkspaceCache,
    restoreWorkspaceCache,
  };
}
