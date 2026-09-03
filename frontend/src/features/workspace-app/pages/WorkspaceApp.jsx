import { useState } from 'react';
import WorkspaceAppSidebar from '../components/WorkspaceAppSidebar';
import WorkspaceAppTopbar from '../components/WorkspaceAppTopbar';
import MyDashboardView from '../components/MyDashboardView';
import TasksView from '../components/TasksView';
import TeamMembersView from '../components/TeamMembersView';
import ChatView from '../components/ChatView';
import JitRequestView from '../components/JitRequestView';
import AnnouncementsView from '../components/AnnouncementsView';
import DirectMessageSidebar from '../components/DirectMessageSidebar';
import { MOCK_ANNOUNCEMENTS, MOCK_CURRENT_USER, WORKSPACE_PERSONAS } from '../constants/workspaceApp.constants';

export default function WorkspaceApp({ workspace, currentUser, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState('usr-dm');
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [dismissedBannerIds, setDismissedBannerIds] = useState([]);

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
            workspace={workspace}
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
        return <JitRequestView currentUser={user} />;
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
          <div className="flex flex-col gap-lg max-w-7xl mx-auto p-lg">
            <h1 className="font-display-title text-[22px] font-semibold text-on-surface">
              Audit Log
            </h1>
            <p className="font-body-sm text-on-surface-variant">
              Immutable workspace events and authorization trails.
            </p>
            <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm divide-y divide-border-subtle">
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-warning-bg text-on-tertiary-fixed flex items-center justify-center shrink-0 font-label-bold text-label-sm">
                  DM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface">
                      Diana Morales (You)
                    </p>
                    <span className="text-[11px] text-on-surface-variant">18m ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    Elevated to DevSecOps Admin via Ticket #INC-8492
                  </p>
                </div>
              </div>
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 font-label-bold text-label-sm">
                  CD
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface">Charlie Davis</p>
                    <span className="text-[11px] text-on-surface-variant">34m ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    Provisioned bridge #infra-db-latency in Slack
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <MyDashboardView
            currentUser={user}
            workspace={workspace}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="bg-surface font-body-base text-on-surface antialiased flex min-h-screen w-full overflow-x-hidden">
      {/* Sidebar with Toggle */}
      <WorkspaceAppSidebar
        workspace={workspace}
        activeView={activeView}
        onSelectView={setActiveView}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {activeView !== 'dashboard' && (
          <WorkspaceAppTopbar
            workspace={workspace}
            currentUser={user}
            personas={WORKSPACE_PERSONAS}
            onSwitchPersona={setSelectedPersonaId}
            unreadAnnouncementsCount={unreadAnnouncementsCount}
            onAnnouncementsClick={() => setActiveView('announcements')}
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
    </div>
  );
}
