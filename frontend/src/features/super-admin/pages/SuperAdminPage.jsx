import { useState } from 'react';
import SuperAdminSidebar from '../shell/SuperAdminSidebar';
import SuperAdminTopbar from '../shell/SuperAdminTopbar';
import PlatformMetricsCards from '../components/PlatformMetricsCards';
import RecentActivityFeed from '../components/RecentActivityFeed';
import ActiveWorkspacesWidget from '../components/ActiveWorkspacesWidget';
import UsersAccessView from '../components/UsersAccessView';
import RolesView from '../components/RolesView';
import JitAccessView from '../components/JitAccessView';
import SystemBroadcastsView from '../components/SystemBroadcastsView';
import SecurityAuditView from '../components/SecurityAuditView';
import WorkspaceModal from '../components/WorkspaceModal';
import Toast from '../../../components/shared/Toast';
import { useToast } from '../../../lib/useToast';
import { MOCK_ACTIVE_WORKSPACES } from '@/constants';

export default function SuperAdminPage({ currentUser, onLogout, onJumpIntoWorkspace }) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [toast, showToast] = useToast(3500);
  const [workspaces, setWorkspaces] = useState(() => {
    try {
      const saved = localStorage.getItem('platform_workspaces_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_ACTIVE_WORKSPACES;
  });

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
          onBroadcast={() => setActiveNav('system-broadcasts')}
        />

        <main className="relative pt-16 w-full flex-1 overflow-x-hidden">
          {activeNav === 'users-access' ? (
            <UsersAccessView />
          ) : activeNav === 'roles-rbac' ? (
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
              <PlatformMetricsCards />
              <div className="flex flex-col lg:flex-row gap-xl w-full">
                <RecentActivityFeed />
                <ActiveWorkspacesWidget
                  workspaces={workspaces}
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
