import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useApp } from '@/context/useApp';
import { WorkspaceProvider } from '@/context/WorkspaceContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary';
import WorkspaceAppSidebar from '../shell/WorkspaceAppSidebar';
import WorkspaceAppTopbar from '../shell/WorkspaceAppTopbar';
import DirectMessageSidebar from '../shell/DirectMessageSidebar';
import TeamSettingsModal from '../modules/announcements/TeamSettingsModal';

// Sub-view lazy dynamic loading (Milestone M6)
const MyDashboardView = lazy(() => import('../modules/dashboard/MyDashboardView'));
const MyPermissionsView = lazy(() => import('../modules/dashboard/MyPermissionsView'));
const TasksView = lazy(() => import('../modules/tasks/TasksView'));
const TeamMembersView = lazy(() => import('../modules/members/TeamMembersView'));
const ChatView = lazy(() => import('../modules/chat/ChatView'));
const JitRequestView = lazy(() => import('../modules/jit/JitRequestView'));
const AnnouncementsView = lazy(() => import('../modules/announcements/AnnouncementsView'));
const WorkspaceAuditLogView = lazy(() => import('../modules/audit/WorkspaceAuditLogView'));

function ViewLoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-on-surface-variant">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
          progress_activity
        </span>
        <span className="text-[13px] font-medium">Loading view...</span>
      </div>
    </div>
  );
}

export default function WorkspaceApp({ workspace, currentUser, onLogout }) {
  const { activeWorkspace, authUser, selectWorkspace } = useApp();
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeBulletins, setActiveBulletins] = useState([]);
  const [dismissedBannerIds, setDismissedBannerIds] = useState([]);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);

  const effectiveWorkspace = useMemo(
    () => activeWorkspace || workspace || { name: 'Acme Engineering' },
    [activeWorkspace, workspace]
  );
  const teamId = effectiveWorkspace?._id || effectiveWorkspace?.id;

  const handleSaveTeamSettings = (updated) => {
    selectWorkspace?.(updated);
    try {
      localStorage.setItem('active_workspace', JSON.stringify(updated));
      const storedList = localStorage.getItem('platform_workspaces_list');
      if (storedList) {
        const list = JSON.parse(storedList);
        const nextList = list.map((w) => (w.id === updated.id ? { ...w, ...updated } : w));
        localStorage.setItem('platform_workspaces_list', JSON.stringify(nextList));
      }
    } catch (err) {
      console.warn('Failed to update workspace cache:', err);
    }
    setIsTeamSettingsOpen(false);
  };

  const [directMessageTarget, setDirectMessageTarget] = useState(null);
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [isDirectMessageMinimized, setIsDirectMessageMinimized] = useState(false);

  const handleOpenDirectMessage = (targetMember) => {
    setDirectMessageTarget(targetMember);
    setIsDirectMessageOpen(true);
    setIsDirectMessageMinimized(false);
  };

  const effectiveUser = useMemo(() => {
    return authUser || currentUser || {};
  }, [authUser, currentUser]);

  const fetchAnnouncementsAndBulletins = useCallback(async () => {
    if (!teamId) return;
    try {
      const [annRes, bulRes] = await Promise.allSettled([
        api.get(`/api/teams/${teamId}/announcements`),
        api.get(`/api/teams/${teamId}/bulletins`),
      ]);

      if (annRes.status === 'fulfilled') {
        const raw = annRes.value.data?.data?.announcements || annRes.value.data?.data || [];
        setAnnouncements(
          raw.map((a) => ({
            id: a._id || a.id,
            ...a,
            authorName: a.authorId?.name || a.author?.name || 'Workspace Admin',
            authorRole: a.authorId?.role || a.author?.role || 'Team Admin',
            authorInitials: (a.authorId?.name || a.author?.name || 'WA')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            timestamp: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Recent',
            readBy: a.readBy || [],
            acknowledgedBy: a.acknowledgedBy || [],
            isRead: a.readBy?.includes(effectiveUser?._id || effectiveUser?.id),
            isAcknowledged: a.acknowledgedBy?.includes(effectiveUser?._id || effectiveUser?.id),
          }))
        );
      }

      if (bulRes.status === 'fulfilled') {
        const rawBul = bulRes.value.data?.data?.bulletins || bulRes.value.data?.data || [];
        setActiveBulletins(rawBul);
      }
    } catch (err) {
      console.error('Failed to load announcements & bulletins:', err);
    }
  }, [teamId, effectiveUser]);

  useEffect(() => {
    fetchAnnouncementsAndBulletins();
  }, [fetchAnnouncementsAndBulletins]);

  useEffect(() => {
    if (!teamId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleAnnouncementCreated = () => {
      fetchAnnouncementsAndBulletins();
    };

    socket.on('announcement:created', handleAnnouncementCreated);
    socket.on('bulletin:created', handleAnnouncementCreated);

    return () => {
      socket.off('announcement:created', handleAnnouncementCreated);
      socket.off('bulletin:created', handleAnnouncementCreated);
    };
  }, [teamId, fetchAnnouncementsAndBulletins]);

  const unreadAnnouncementsCount = useMemo(() => {
    return announcements.filter((a) => !a.isRead).length;
  }, [announcements]);

  const validBulletins = activeBulletins.filter((b) => {
    if (b.status && b.status !== 'ACTIVE') return false;
    const id = b._id || b.id;
    if (dismissedBannerIds.includes(id)) return false;
    const now = new Date();

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
            currentUser={effectiveUser}
            workspace={effectiveWorkspace}
            onNavigate={handleNavigate}
          />
        );
      case 'tasks':
        return <TasksView currentUser={effectiveUser} workspace={effectiveWorkspace} />;
      case 'team-members':
        return (
          <TeamMembersView
            currentUser={effectiveUser}
            workspace={effectiveWorkspace}
            onOpenDirectMessage={handleOpenDirectMessage}
          />
        );
      case 'chat':
        return <ChatView currentUser={effectiveUser} workspace={effectiveWorkspace} />;
      case 'jit-request':
      case 'jit-access':
        return <JitRequestView currentUser={effectiveUser} workspace={effectiveWorkspace} />;
      case 'my-permissions':
        return (
          <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex-1">
            <MyPermissionsView currentUser={effectiveUser} workspace={effectiveWorkspace} />
          </div>
        );
      case 'announcements':
        return (
          <AnnouncementsView
            currentUser={effectiveUser}
            workspace={effectiveWorkspace}
            announcements={announcements}
            onAddAnnouncement={handleAddAnnouncement}
            onMarkRead={handleMarkRead}
            onAcknowledge={handleAcknowledge}
          />
        );
      case 'audit-log':
        return (
          <WorkspaceAuditLogView
            currentUser={effectiveUser}
            workspace={effectiveWorkspace}
            onNavigate={handleNavigate}
          />
        );
      default:
        return (
          <MyDashboardView
            currentUser={effectiveUser}
            workspace={effectiveWorkspace}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <WorkspaceProvider teamId={teamId}>
      <div className="bg-surface font-body-base text-on-surface antialiased flex min-h-screen w-full overflow-x-hidden">
        {/* Sidebar with Toggle */}
        <WorkspaceAppSidebar
          currentUser={effectiveUser}
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
              workspace={effectiveWorkspace}
              currentUser={effectiveUser}
              onOpenTeamSettings={() => setIsTeamSettingsOpen(true)}
              unreadAnnouncementsCount={unreadAnnouncementsCount}
              onAnnouncementsClick={() => setActiveView('announcements')}
              onSelectTab={(tab) => setActiveView(tab)}
              onLogout={onLogout}
            />
          )}

          {/* Pinned System-Level Broadcast / Bulletin Banner */}
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

          <main className="w-full bg-surface flex-1 min-w-0 overflow-x-hidden flex flex-col">
            <ErrorBoundary>
              <Suspense fallback={<ViewLoadingFallback />}>
                {renderView()}
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>

        {/* Persistent Direct Messaging Sidebar / Dock */}
        <DirectMessageSidebar
          targetMember={directMessageTarget}
          currentUser={effectiveUser}
          isOpen={isDirectMessageOpen}
          isMinimized={isDirectMessageMinimized}
          onClose={() => setIsDirectMessageOpen(false)}
          onToggleMinimize={() => setIsDirectMessageMinimized((prev) => !prev)}
        />

        {/* Team Settings Modal */}
        <TeamSettingsModal
          isOpen={isTeamSettingsOpen}
          workspace={effectiveWorkspace}
          onClose={() => setIsTeamSettingsOpen(false)}
          onSave={handleSaveTeamSettings}
        />
      </div>
    </WorkspaceProvider>
  );
}
