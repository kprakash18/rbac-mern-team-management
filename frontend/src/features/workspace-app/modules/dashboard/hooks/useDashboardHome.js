import { useMemo } from 'react';
import { useApp } from '@/context/useApp';
import { usePermissionCatalog } from '@/features/permissions/hooks/usePermissionCatalog';
import { useWorkspaceBootstrap } from '../../../hooks/useWorkspaceBootstrap';

export function useDashboardHome({ currentUser, workspace }) {
  const { isSuperAdmin, workspacePermissions } = useApp();
  const teamId = workspace?._id || workspace?.id;
  const { data: catalogPermissions = [] } = usePermissionCatalog();
  const { data: bootstrapData, isLoading: loading } = useWorkspaceBootstrap(teamId);
  const { stats, recentActivity } = bootstrapData || {};

  const activities = useMemo(() => (recentActivity || []).map((activity) => {
    const actorName = activity.actor || 'Teammate';
    return {
      id: activity.id,
      actor: actorName,
      actorId: activity.actorId,
      initials: actorName.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase() || 'TM',
      action: activity.action || 'Performed action',
      time: activity.createdAt
        ? new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Recently',
      bgClass: 'bg-primary-container text-on-primary',
    };
  }), [recentActivity]);

  const metrics = useMemo(() => {
    const totalCatalogCount = catalogPermissions?.length > 0 ? catalogPermissions.length : 39;
    const effectivePermissionsCount = Array.isArray(workspacePermissions) && workspacePermissions.length > 0
      ? workspacePermissions.filter((permission) => permission !== '*').length
      : (currentUser?.permissions?.length || 0);
    const capabilitiesCount = (isSuperAdmin || (Array.isArray(workspacePermissions) && workspacePermissions.includes('*')))
      ? totalCatalogCount
      : effectivePermissionsCount;

    return {
      capabilitiesCount,
      totalCapabilities: totalCatalogCount,
      activeJitCount: stats?.activeJitCount || 0,
      activeMembersCount: stats?.memberCount || 0,
      tasksCount: stats?.taskCount || 0,
      completedTasksCount: stats?.completedTaskCount || 0,
    };
  }, [catalogPermissions, workspacePermissions, currentUser?.permissions, isSuperAdmin, stats]);

  return { activities, loading, metrics };
}
