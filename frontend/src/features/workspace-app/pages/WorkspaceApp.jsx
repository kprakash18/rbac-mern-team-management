import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import WorkspaceAppSidebar from '../shell/WorkspaceAppSidebar';
import WorkspaceAppTopbar from '../shell/WorkspaceAppTopbar';
import DirectMessageSidebar from '../shell/DirectMessageSidebar';
import MyDashboardView from '../modules/dashboard/MyDashboardView';
import MyPermissionsView from '../modules/dashboard/MyPermissionsView';
import TasksView from '../modules/tasks/TasksView';
import TeamMembersView from '../modules/members/TeamMembersView';
import ChatView from '../modules/chat/ChatView';
import JitRequestView from '../modules/jit/JitRequestView';
import AnnouncementsView from '../modules/announcements/AnnouncementsView';
import TeamSettingsModal from '../modules/announcements/TeamSettingsModal';
import WorkspaceAuditLogView from '../modules/audit/WorkspaceAuditLogView';

export default function WorkspaceApp({ workspace, currentUser, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeBulletins, setActiveBulletins] = useState([]);
  const [dismissedBannerIds, setDismissedBannerIds] = useState([]);

  // Active Workspace State & Team Settings Modal (PATCH /api/teams/:teamId)
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    try {
      const saved = localStorage.getItem('active_workspace');
      if (saved) return JSON.parse(saved);
    } catch {}
    return workspace || { name: 'Acme Engineering' };
  });
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  }, [workspace]);

  const handleSaveTeamSettings = (updated) => {
    setCurrentWorkspace(updated);
    try {
      localStorage.setItem('active_workspace', JSON.stringify(updated));
      const storedList = localStorage.getItem('platform_workspaces_list');
      if (storedList) {
        const list = JSON.parse(storedList);
        const nextList = list.map((w) => (w.id === updated.id ? { ...w, ...updated } : w));
        localStorage.setItem('platform_workspaces_list', JSON.stringify(nextList));
      }
    } catch (err) {
      console.error(err);
    }
    setIsTeamSettingsOpen(false);
  };

  // Persistent Direct Messaging State
  const [directMessageTarget, setDirectMessageTarget] = useState(null);
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [isDirectMessageMinimized, setIsDirectMessageMinimized] = useState(false);

  const handleOpenDirectMessage = (member) => {
    setDirectMessageTarget(member);
    setIsDirectMessageOpen(true);
    setIsDirectMessageMinimized(false);
  };

  const isTeamAdmin = Boolean(
    currentUser?.isTeamAdmin ||
    currentWorkspace?.isTeamAdmin ||
    currentWorkspace?.role === 'Team Admin' ||
    currentWorkspace?.role?.toLowerCase().includes('admin')
  );

  const teamRoleTitle =
    currentWorkspace?.role ||
    currentUser?.teamRoleTitle ||
    (isTeamAdmin ? 'Team Admin' : 'Developer');

  const user = {
    ...(currentUser || {}),
    isTeamAdmin,
    teamRoleTitle,
    teamRole: teamRoleTitle,
    role: teamRoleTitle,
  };
  const unreadAnnouncementsCount = announcements.filter((a) => !a.isRead).length;

  const fetchActiveBulletins = useCallback(async () => {
    const teamId = currentWorkspace?._id || currentWorkspace?.id;
    try {
      const res = await api.get('/api/notifications/bulletins/active', {
        params: teamId ? { teamId } : {},
      });
      if (res.data?.success) {
        setActiveBulletins(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch active bulletins:', err);
    }
  }, [currentWorkspace?._id, currentWorkspace?.id]);

  useEffect(() => {
    fetchActiveBulletins();

    const socket = getSocket();
    if (!socket) return; // Socket not yet connected (e.g. after page refresh — guard against null crash)

    const handleNewBulletin = (bulletin) => {
      // If bulletin is workspace-scoped, only accept if it matches the current workspace
      if (bulletin.scope === 'WORKSPACE_SCOPED') {
        const targets = (bulletin.targetWorkspaces || []).filter((t) => typeof t === 'string' && !t.includes('All Workspaces'));
        if (targets.length > 0) {
          const wsId = currentWorkspace?._id || currentWorkspace?.id;
          const wsName = currentWorkspace?.name;
          const isMatch = targets.some(
            (t) =>
              t === String(wsId) ||
              (wsName && t.trim().toLowerCase() === wsName.trim().toLowerCase())
          );
          if (!isMatch) return;
        }
      }

      const now = new Date();
      const starts = bulletin.startsAt ? new Date(bulletin.startsAt) : now;
      const expires = bulletin.expiresAt ? new Date(bulletin.expiresAt) : null;
      if (starts <= now && (!expires || expires > now)) {
        setActiveBulletins((prev) => [
          bulletin,
          ...prev.filter((b) => (b._id || b.id) !== (bulletin._id || bulletin.id)),
        ]);
      }
    };

    socket.on('bulletin:new', handleNewBulletin);
    socket.on('broadcast:new', handleNewBulletin);

    return () => {
      socket.off('bulletin:new', handleNewBulletin);
      socket.off('broadcast:new', handleNewBulletin);
    };
  }, [fetchActiveBulletins, currentWorkspace]);

  const now = new Date();
  const validBulletins = activeBulletins.filter((b) => {
    const bId = b._id || b.id;
    if (dismissedBannerIds.includes(bId)) return false;

    // Check workspace scope for displayed bulletins
    if (b.scope === 'WORKSPACE_SCOPED') {
      const targets = (b.targetWorkspaces || []).filter((t) => typeof t === 'string' && !t.includes('All Workspaces'));
      if (targets.length > 0) {
        const wsId = currentWorkspace?._id || currentWorkspace?.id;
        const wsName = currentWorkspace?.name;
        const isMatch = targets.some(
          (t) =>
            t === String(wsId) ||
            (wsName && t.trim().toLowerCase() === wsName.trim().toLowerCase())
        );
        if (!isMatch) return false;
      }
    }

    const starts = b.startsAt ? new Date(b.startsAt) : now;
    const expires = b.expiresAt ? new Date(b.expiresAt) : null;
    return starts <= now && (!expires || expires > now);
  });

  const pinnedAnnouncement = announcements.find((a) => a.isSticky && !dismissedBannerIds.includes(a.id));
  const displayedBulletin =
    validBulletins[0] ||
    (pinnedAnnouncement && !dismissedBannerIds.includes(pinnedAnnouncement.id) ? pinnedAnnouncement : null);

  const handleAddAnnouncement = (newAnn) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const handleMarkRead = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const handleAcknowledge = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isAcknowledged: true, isRead: true } : a))
    );
  };

  const handleNavigate = (targetView) => {
    if (targetView === 'logout') {
      onLogout?.();
    } else {
      setActiveView(targetView);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <MyDashboardView
            currentUser={user}
            workspace={currentWorkspace}
            onNavigate={handleNavigate}
          />
        );
      case 'tasks':
        return <TasksView currentUser={user} workspace={currentWorkspace} />;
      case 'team-members':
        return (
          <TeamMembersView
            currentUser={user}
            workspace={currentWorkspace}
            onOpenDirectMessage={handleOpenDirectMessage}
          />
        );
      case 'chat':
        return <ChatView currentUser={user} workspace={currentWorkspace} />;
      case 'jit-request':
      case 'jit-access':
        return <JitRequestView currentUser={user} workspace={currentWorkspace} />;
      case 'my-permissions':
        return (
          <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex-1">
            <MyPermissionsView currentUser={user} workspace={currentWorkspace} />
          </div>
        );
      case 'announcements':
        return (
          <AnnouncementsView
            currentUser={user}
            workspace={currentWorkspace}
            announcements={announcements}
            onAddAnnouncement={handleAddAnnouncement}
            onMarkRead={handleMarkRead}
            onAcknowledge={handleAcknowledge}
          />
        );
      case 'audit-log':
        return (
          <WorkspaceAuditLogView
            currentUser={user}
            workspace={currentWorkspace}
            onNavigate={handleNavigate}
          />
        );
      default:
        return (
          <MyDashboardView
            currentUser={user}
            workspace={currentWorkspace}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="bg-surface font-body-base text-on-surface antialiased flex min-h-screen w-full overflow-x-hidden">
      {/* Sidebar with Toggle */}
      <WorkspaceAppSidebar
        workspace={currentWorkspace}
        currentUser={user}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenTeamSettings={() => setIsTeamSettingsOpen(true)}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {activeView !== 'dashboard' && (
          <WorkspaceAppTopbar
            workspace={currentWorkspace}
            currentUser={user}
            onOpenTeamSettings={() => setIsTeamSettingsOpen(true)}
            unreadAnnouncementsCount={unreadAnnouncementsCount}
            onAnnouncementsClick={() => setActiveView('announcements')}
            onSelectTab={(tab) => setActiveView(tab)}
            onLogout={onLogout}
          />
        )}

        {/* Pinned System-Level Broadcast / Bulletin Banner (Seen by All Users) */}
        {displayedBulletin && (
          <div className="w-full bg-primary text-on-primary px-margin-mobile lg:px-margin-desktop py-2.5 flex items-center justify-between text-[13px] shadow-sm z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-[20px] text-amber-300 shrink-0">
                campaign
              </span>
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-amber-200 uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded bg-white/10">
                  SYSTEM BULLETIN
                </span>
                <span className="font-semibold truncate">{displayedBulletin.title}</span>
                <span className="hidden md:inline text-on-primary/75 truncate text-[12px]">
                  — {displayedBulletin.body || displayedBulletin.message}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-3">
              <button
                type="button"
                onClick={() => setActiveView('announcements')}
                className="text-[12px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
              >
                View Notice
              </button>
              <button
                type="button"
                onClick={() =>
                  setDismissedBannerIds((prev) => [...prev, displayedBulletin._id || displayedBulletin.id])
                }
                className="p-1 hover:bg-white/15 rounded-md cursor-pointer transition-colors"
                title="Dismiss banner"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        <main className="w-full bg-surface flex-1 min-w-0 overflow-x-hidden">
          {renderView()}
        </main>
      </div>

      {/* Persistent Direct Messaging Sidebar / Dock */}
      <DirectMessageSidebar
        targetMember={directMessageTarget}
        currentUser={user}
        isOpen={isDirectMessageOpen}
        isMinimized={isDirectMessageMinimized}
        onClose={() => setIsDirectMessageOpen(false)}
        onToggleMinimize={() => setIsDirectMessageMinimized((prev) => !prev)}
      />

      {/* Team Settings Modal (PATCH /api/teams/:id) */}
      <TeamSettingsModal
        isOpen={isTeamSettingsOpen}
        workspace={currentWorkspace}
        onClose={() => setIsTeamSettingsOpen(false)}
        onSave={handleSaveTeamSettings}
      />
    </div>
  );
}
