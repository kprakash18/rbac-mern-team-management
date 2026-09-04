import { useState } from 'react';
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
import { MOCK_ANNOUNCEMENTS, MOCK_CURRENT_USER, WORKSPACE_PERSONAS } from '@/constants';

export default function WorkspaceApp({ workspace, currentUser, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const initialPersonaId =
    WORKSPACE_PERSONAS.find((p) => p.email?.toLowerCase() === currentUser?.email?.toLowerCase())?.id ||
    (currentUser?.email?.includes('marcus') ? 'usr-mv' : currentUser?.id) ||
    'usr-dm';
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonaId);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
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
    } catch {}
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

  const user = WORKSPACE_PERSONAS.find((p) => p.id === selectedPersonaId) || currentUser || MOCK_CURRENT_USER;
  const unreadAnnouncementsCount = announcements.filter((a) => !a.isRead).length;

  const pinnedAnnouncement = announcements.find((a) => a.isSticky && !dismissedBannerIds.includes(a.id));

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
            personas={WORKSPACE_PERSONAS}
            onSwitchPersona={setSelectedPersonaId}
            onNavigate={handleNavigate}
          />
        );
      case 'tasks':
        return <TasksView currentUser={user} />;
      case 'team-members':
        return <TeamMembersView currentUser={user} onOpenDirectMessage={handleOpenDirectMessage} />;
      case 'chat':
        return <ChatView currentUser={user} />;
      case 'jit-request':
      case 'jit-access':
        return <JitRequestView currentUser={user} />;
      case 'my-permissions':
        return (
          <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex-1">
            <MyPermissionsView currentUser={user} />
          </div>
        );
      case 'announcements':
        return (
          <AnnouncementsView
            currentUser={user}
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
            personas={WORKSPACE_PERSONAS}
            onSwitchPersona={setSelectedPersonaId}
            onOpenTeamSettings={() => setIsTeamSettingsOpen(true)}
            unreadAnnouncementsCount={unreadAnnouncementsCount}
            onAnnouncementsClick={() => setActiveView('announcements')}
            onSelectTab={(tab) => setActiveView(tab)}
            onLogout={onLogout}
          />
        )}

        {/* Pinned System-Level Broadcast Banner (Seen by All Users) */}
        {pinnedAnnouncement && (
          <div className="w-full bg-primary text-on-primary px-margin-mobile lg:px-margin-desktop py-2.5 flex items-center justify-between text-[13px] shadow-sm z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-[20px] text-amber-300 shrink-0">
                campaign
              </span>
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-amber-200 uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded bg-white/10">
                  SYSTEM BROADCAST
                </span>
                <span className="font-semibold truncate">{pinnedAnnouncement.title}</span>
                <span className="hidden md:inline text-on-primary/75 truncate text-[12px]">
                  — {pinnedAnnouncement.body}
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
                onClick={() => setDismissedBannerIds((prev) => [...prev, pinnedAnnouncement.id])}
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
