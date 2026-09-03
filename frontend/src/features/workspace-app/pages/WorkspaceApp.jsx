import { useState } from 'react';
import WorkspaceAppSidebar from '../components/WorkspaceAppSidebar';
import WorkspaceAppTopbar from '../components/WorkspaceAppTopbar';
import MyDashboardView from '../components/MyDashboardView';
import TeamMembersView from '../components/TeamMembersView';
import MyPermissionsView from '../components/MyPermissionsView';
import JitRequestView from '../components/JitRequestView';
import AnnouncementsView from '../components/AnnouncementsView';
import { MOCK_ANNOUNCEMENTS, MOCK_CURRENT_USER } from '../constants/workspaceApp.constants';

export default function WorkspaceApp({ workspace, currentUser, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');
  const user = currentUser || MOCK_CURRENT_USER;
  const unreadAnnouncementsCount = MOCK_ANNOUNCEMENTS.filter((a) => !a.isRead).length;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <MyDashboardView
            currentUser={user}
            workspace={workspace}
            onNavigate={setActiveView}
          />
        );
      case 'team-members':
        return <TeamMembersView />;
      case 'my-permissions':
        return <MyPermissionsView />;
      case 'jit-request':
        return <JitRequestView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'audit-log':
        return (
          <div className="flex flex-col gap-lg max-w-7xl mx-auto p-lg">
            <h1 className="font-display-title text-[22px] font-semibold text-on-surface">Audit Log</h1>
            <p className="font-body-sm text-on-surface-variant">Immutable workspace events and authorization trails.</p>
            <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm divide-y divide-border-subtle">
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-warning-bg text-on-tertiary-fixed flex items-center justify-center shrink-0 font-label-bold text-label-sm">DM</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface">Diana Morales (You)</p>
                    <span className="text-[11px] text-on-surface-variant">18m ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Elevated to DevSecOps Admin via Ticket #INC-8492</p>
                </div>
              </div>
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 font-label-bold text-label-sm">CD</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface">Charlie Davis</p>
                    <span className="text-[11px] text-on-surface-variant">34m ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Provisioned bridge #infra-db-latency in Slack</p>
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
            onNavigate={setActiveView}
          />
        );
    }
  };

  return (
    <div className="bg-surface font-body-base text-on-surface antialiased flex min-h-screen">
      {/* Verbatim Sidebar */}
      <WorkspaceAppSidebar
        workspace={workspace}
        currentUser={user}
        activeView={activeView}
        onSelectView={setActiveView}
        onLogout={onLogout}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {activeView !== 'dashboard' && (
          <WorkspaceAppTopbar
            workspace={workspace}
            currentUser={user}
            unreadAnnouncementsCount={unreadAnnouncementsCount}
            onAnnouncementsClick={() => setActiveView('announcements')}
          />
        )}

        <main className={`w-full bg-surface flex-1 ${activeView !== 'dashboard' ? 'p-xl' : ''}`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}
