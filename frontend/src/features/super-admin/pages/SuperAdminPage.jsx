import { useState, useEffect, useCallback } from 'react';
import SuperAdminSidebar from '../shell/SuperAdminSidebar';
import SuperAdminTopbar from '../shell/SuperAdminTopbar';
import PlatformMetricsCards from '../components/PlatformMetricsCards';
import RecentActivityFeed from '../components/RecentActivityFeed';
import ActiveWorkspacesWidget from '../components/ActiveWorkspacesWidget';
import UsersAccessView from '../components/UsersAccessView';
import TeamsView from '../components/TeamsView';
import RolesView from '../components/RolesView';
import JitAccessView from '../components/JitAccessView';
import SystemBroadcastsView from '../components/SystemBroadcastsView';
import SecurityAuditView from '../components/SecurityAuditView';
import WorkspaceModal from '../components/WorkspaceModal';
import Toast from '../../../components/shared/Toast';
import { useToast } from '../../../lib/useToast';
import api from '@/lib/api';
import { getSocket } from '../../../lib/socket';

function formatActivityItem(l) {
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

export default function SuperAdminPage({ currentUser, onLogout, onJumpIntoWorkspace }) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [createTeamTrigger, setCreateTeamTrigger] = useState(0);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [toast, showToast] = useToast(3500);
  const [workspaces, setWorkspaces] = useState([]);
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState({
    workspaces: { total: 0, active: 0, archived: 0 },
    users: { total: 0, active: 0, invited: 0, suspended: 0 },
    jitGrants: { active: 0, trending: '0', percentage: '0%' },
    securityEvents: { today: 0, last24Hours: 'Live stream' },
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsRes, usersRes] = await Promise.allSettled([
        api.get('/api/teams'),
        api.get('/api/users'),
      ]);

      const rawTeams = teamsRes.status === 'fulfilled' ? (teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || []) : [];
      const rawUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || []) : [];

      const formattedWorkspaces = rawTeams.map((w) => ({
        ...w,
        id: w._id || w.id,
        name: w.name,
        description: w.description || 'Workspace',
        status: w.status === 'ACTIVE' ? 'Active' : w.status === 'ARCHIVED' ? 'Archived' : w.status || 'Active',
        membersCount: w.membersCount || 1,
        tier: w.tier || 'Standard RBAC',
      }));
      setWorkspaces(formattedWorkspaces);

      // Direct jump into workspace if navigated via email teamId link
      const params = new URLSearchParams(window.location.search);
      const targetTeamId = params.get('teamId') || params.get('workspace');
      if (targetTeamId && onJumpIntoWorkspace) {
        const matched = formattedWorkspaces.find(
          (w) => String(w.id) === String(targetTeamId) || String(w._id) === String(targetTeamId)
        );
        if (matched) {
          onJumpIntoWorkspace(matched);
        }
      }

      const activeWs = formattedWorkspaces.filter((w) => w.status !== 'Archived').length;
      const archivedWs = formattedWorkspaces.filter((w) => w.status === 'Archived').length;

      const activeU = rawUsers.filter((u) => (u.accountStatus || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
      const invitedU = rawUsers.filter((u) => (u.accountStatus || '').toUpperCase() === 'INVITED').length;
      const suspendedU = rawUsers.filter((u) => ['SUSPENDED', 'DISABLED'].includes((u.accountStatus || '').toUpperCase())).length;

      let fetchedActivities = [];
      let activeJitCount = 0;

      const [auditRes, jitRes] = await Promise.allSettled([
        api.get('/api/audit-logs?limit=30'),
        api.get('/api/access-requests'),
      ]);

      if (auditRes.status === 'fulfilled' && auditRes.value.data?.data) {
        const logs = Array.isArray(auditRes.value.data.data)
          ? auditRes.value.data.data
          : auditRes.value.data.data.logs || [];
        fetchedActivities = logs.map(formatActivityItem);
      }

      if (jitRes.status === 'fulfilled' && jitRes.value.data?.data) {
        const jits = Array.isArray(jitRes.value.data.data) ? jitRes.value.data.data : [];
        activeJitCount = jits.filter((j) => j.status === 'APPROVED' || j.status === 'ACTIVE').length;
      }

      setActivities(fetchedActivities);
      setMetrics({
        workspaces: { total: formattedWorkspaces.length, active: activeWs, archived: archivedWs },
        users: { total: rawUsers.length, active: activeU, invited: invitedU, suspended: suspendedU },
        jitGrants: { active: activeJitCount, trending: `+${activeJitCount}`, percentage: '100%' },
        securityEvents: { today: fetchedActivities.length, last24Hours: 'Live audit log stream' },
      });
    } catch (err) {
      console.error('Failed to load platform dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    if (!socket) return;

    const handleNewActivity = (newLog) => {
      const formatted = formatActivityItem(newLog);
      setActivities((prev) => [formatted, ...prev.filter((a) => a.id !== formatted.id)].slice(0, 30));
      setMetrics((prev) => ({
        ...prev,
        securityEvents: {
          ...prev.securityEvents,
          today: (prev.securityEvents?.today || 0) + 1,
        },
      }));
    };

    socket.on('audit:new', handleNewActivity);
    return () => {
      socket.off('audit:new', handleNewActivity);
    };
  }, [fetchDashboardData]);

  const handleCreateWorkspace = (newWs) => {
    setWorkspaces((prev) => {
      const nextList = [newWs, ...prev];
      try {
        localStorage.setItem('platform_workspaces_list', JSON.stringify(nextList));
      } catch (err) {
        console.error(err);
      }
      return nextList;
    });

    // Also register in user accessible workspaces list
    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      storedUserWs.unshift({
        id: newWs.id,
        name: newWs.name,
        description: newWs.description,
        icon: newWs.icon || 'engineering',
        membersCount: newWs.membersCount || 1,
        status: 'Active',
        tier: newWs.tier || 'Standard',
      });
      localStorage.setItem('custom_workspaces', JSON.stringify(storedUserWs));
    } catch {}
    showToast(`Workspace "${newWs.name}" successfully created.`);
  };

  const handleUpdateWorkspace = (updatedWs) => {
    setWorkspaces((prev) => {
      const nextList = prev.map((ws) => (ws.id === updatedWs.id ? updatedWs : ws));
      try {
        localStorage.setItem('platform_workspaces_list', JSON.stringify(nextList));
      } catch (err) {
        console.error(err);
      }
      return nextList;
    });

    // Sync in user accessible custom workspaces list
    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      const nextUserWs = storedUserWs.map((ws) => (ws.id === updatedWs.id ? { ...ws, ...updatedWs } : ws));
      localStorage.setItem('custom_workspaces', JSON.stringify(nextUserWs));
    } catch {}

    setEditingWorkspace(null);
    showToast(`Workspace "${updatedWs.name}" settings updated.`);
  };

  const handleArchiveWorkspace = (workspaceId) => {
    let targetName = 'Workspace';
    setWorkspaces((prev) => {
      const nextList = prev.map((ws) => {
        if (ws.id === workspaceId) {
          targetName = ws.name;
          return { ...ws, status: 'Archived', archivedAt: new Date().toISOString() };
        }
        return ws;
      });
      try {
        localStorage.setItem('platform_workspaces_list', JSON.stringify(nextList));
      } catch (err) {
        console.error(err);
      }
      return nextList;
    });

    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      const nextUserWs = storedUserWs.map((ws) =>
        ws.id === workspaceId ? { ...ws, status: 'Archived', archivedAt: new Date().toISOString() } : ws
      );
      localStorage.setItem('custom_workspaces', JSON.stringify(nextUserWs));
    } catch {}

    setEditingWorkspace(null);
    showToast(`"${targetName}" has been archived.`);
  };

  const handleRestoreWorkspace = (workspaceId) => {
    let targetName = 'Workspace';
    setWorkspaces((prev) => {
      const nextList = prev.map((ws) => {
        if (ws.id === workspaceId) {
          targetName = ws.name;
          return { ...ws, status: 'Active', archivedAt: null };
        }
        return ws;
      });
      try {
        localStorage.setItem('platform_workspaces_list', JSON.stringify(nextList));
      } catch (err) {
        console.error(err);
      }
      return nextList;
    });

    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      const nextUserWs = storedUserWs.map((ws) =>
        ws.id === workspaceId ? { ...ws, status: 'Active', archivedAt: null } : ws
      );
      localStorage.setItem('custom_workspaces', JSON.stringify(nextUserWs));
    } catch {}

    setEditingWorkspace(null);
    showToast(`"${targetName}" has been restored to Active status.`);
  };

  return (
    <div className="font-body-base text-on-surface bg-surface min-h-screen">
      <SuperAdminSidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onLogout={onLogout}
      />
      
      <div className={`w-full min-h-screen flex flex-col ${isSidebarOpen ? 'pl-72' : 'pl-20'}`}>
        <SuperAdminTopbar
          isSidebarOpen={isSidebarOpen}
          currentUser={currentUser}
          onCreateTeam={() => {
            setActiveNav('teams');
            setCreateTeamTrigger((prev) => prev + 1);
          }}
          onBroadcast={() => setActiveNav('system-broadcasts')}
          onSelectNav={setActiveNav}
          onLogout={onLogout}
        />

        <main className="relative pt-16 w-full flex-1 overflow-x-hidden">
          {activeNav === 'users-access' ? (
            <UsersAccessView />
          ) : activeNav === 'teams' ? (
            <TeamsView onJumpIntoWorkspace={onJumpIntoWorkspace} createTrigger={createTeamTrigger} />
          ) : activeNav === 'roles-rbac' || activeNav === 'roles' ? (
            <RolesView />
          ) : activeNav === 'jit-access' ? (
            <JitAccessView />
          ) : activeNav === 'system-broadcasts' ? (
            <SystemBroadcastsView />
          ) : activeNav === 'security-audit' ? (
            <SecurityAuditView />
          ) : (
            <div className="flex flex-col w-full p-xl gap-xl">
              <div className="flex flex-col gap-xs">
                <h1 className="font-display-title text-on-surface">Dashboard</h1>
                <p className="font-body-base text-on-surface-variant">Platform health and recent activity.</p>
              </div>
              <PlatformMetricsCards metrics={metrics} />
              <div className="flex flex-col lg:flex-row gap-xl w-full">
                <RecentActivityFeed activities={activities} loading={loading} />
                <ActiveWorkspacesWidget
                  workspaces={workspaces}
                  loading={loading}
                  onCreateWorkspaceClick={() => setIsCreateWorkspaceModalOpen(true)}
                  onEditWorkspaceClick={(ws) => setEditingWorkspace(ws)}
                  onJumpInWorkspace={(ws) => onJumpIntoWorkspace?.(ws)}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      <div className="fixed bottom-6 right-6 z-120">
        <Toast message={toast?.msg} type={toast?.type} />
      </div>

      <WorkspaceModal
        isOpen={isCreateWorkspaceModalOpen}
        onClose={() => setIsCreateWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {editingWorkspace && (
        <WorkspaceModal
          isOpen={Boolean(editingWorkspace)}
          workspace={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          onSaveWorkspace={handleUpdateWorkspace}
          onArchiveWorkspace={handleArchiveWorkspace}
          onRestoreWorkspace={handleRestoreWorkspace}
        />
      )}
    </div>
  );
}
