import { memo } from 'react';
import { useApp } from '@/context/useApp';
import { useMyTeams } from '../../hooks/useMyTeams';
import DashboardActivitySection from './components/DashboardActivitySection';
import DashboardMetricCards from './components/DashboardMetricCards';
import DashboardQuickWorkflows from './components/DashboardQuickWorkflows';
import DashboardTopbar from './components/DashboardTopbar';
import DashboardWelcome from './components/DashboardWelcome';
import { useDashboardHome } from './hooks/useDashboardHome';

function MyDashboardView({ currentUser, workspace, onNavigate }) {
  const { selectWorkspace, clearWorkspace, isSuperAdmin } = useApp();
  const { data: workspaces = [] } = useMyTeams({ isSuperAdmin, enabled: true });
  const { activities, loading, metrics } = useDashboardHome({ currentUser, workspace });

  const userName = currentUser?.name || 'Team Member';
  const displayName = userName.includes(' ') ? userName.split(' ')[0] : userName;
  const isTeamAdmin = currentUser?.isTeamAdmin;
  const teamRoleTitle = currentUser?.teamRoleTitle || (isTeamAdmin ? 'Team Admin' : 'Developer');

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg">
      <DashboardTopbar
        clearWorkspace={clearWorkspace}
        currentUser={currentUser}
        onNavigate={onNavigate}
        selectWorkspace={selectWorkspace}
        workspace={workspace}
        workspaces={workspaces}
      />

      <DashboardWelcome
        displayName={displayName}
        teamRoleTitle={teamRoleTitle}
        workspace={workspace}
      />

      <DashboardMetricCards metrics={metrics} onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        <div className="lg:col-span-7 flex flex-col gap-md">
          <DashboardActivitySection
            activities={activities}
            loading={loading}
            onNavigate={onNavigate}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-md">
          <DashboardQuickWorkflows metrics={metrics} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

export default memo(MyDashboardView);
