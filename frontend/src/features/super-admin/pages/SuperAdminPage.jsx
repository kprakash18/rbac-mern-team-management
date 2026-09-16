import { useState, useEffect } from 'react';
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
import { Toast } from '@/shared/components';
import { useToast } from '../../../lib/useToast';
import { useSuperAdminDashboard } from '../hooks/useSuperAdminDashboard';

export default function SuperAdminPage({ currentUser, onLogout, onJumpIntoWorkspace }) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [createTeamTrigger, setCreateTeamTrigger] = useState(0);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [toast, showToast] = useToast(3500);

  const {
    workspaces,
    activities,
    metrics,
    loading,
    createWorkspaceCache,
    updateWorkspaceCache,
    archiveWorkspaceCache,
    restoreWorkspaceCache,
  } = useSuperAdminDashboard();

  useEffect(() => {
    if (!workspaces.length || !onJumpIntoWorkspace) return;
    const params = new URLSearchParams(window.location.search);
    const targetTeamId = params.get('teamId') || params.get('workspace');
    if (targetTeamId) {
      const matched = workspaces.find(
        (w) => String(w.id) === String(targetTeamId) || String(w._id) === String(targetTeamId)
      );
      if (matched) {
        onJumpIntoWorkspace(matched);
      }
    }
  }, [workspaces, onJumpIntoWorkspace]);

  const handleCreateWorkspace = (newWs) => {
    createWorkspaceCache(newWs);
    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      storedUserWs.unshift({
        id: newWs.id || newWs._id,
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
    updateWorkspaceCache(updatedWs);
    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      const targetId = updatedWs.id || updatedWs._id;
      const nextUserWs = storedUserWs.map((ws) =>
        (ws.id || ws._id) === targetId ? { ...ws, ...updatedWs } : ws
      );
      localStorage.setItem('custom_workspaces', JSON.stringify(nextUserWs));
    } catch {}

    setEditingWorkspace(null);
    showToast(`Workspace "${updatedWs.name}" settings updated.`);
  };

  const handleArchiveWorkspace = (workspaceId) => {
    const target = workspaces.find((w) => (w.id || w._id) === workspaceId);
    const targetName = target?.name || 'Workspace';
    archiveWorkspaceCache(workspaceId);

    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      const nextUserWs = storedUserWs.map((ws) =>
        (ws.id || ws._id) === workspaceId
          ? { ...ws, status: 'Archived', archivedAt: new Date().toISOString() }
          : ws
      );
      localStorage.setItem('custom_workspaces', JSON.stringify(nextUserWs));
    } catch {}

    setEditingWorkspace(null);
    showToast(`"${targetName}" has been archived.`);
  };

  const handleRestoreWorkspace = (workspaceId) => {
    const target = workspaces.find((w) => (w.id || w._id) === workspaceId);
    const targetName = target?.name || 'Workspace';
    restoreWorkspaceCache(workspaceId);

    try {
      const storedUserWs = JSON.parse(localStorage.getItem('custom_workspaces') || '[]');
      const nextUserWs = storedUserWs.map((ws) =>
        (ws.id || ws._id) === workspaceId
          ? { ...ws, status: 'Active', archivedAt: null }
          : ws
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
