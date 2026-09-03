import { useState } from 'react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import SuperAdminTopbar from '../components/SuperAdminTopbar';
import PlatformMetricsCards from '../components/PlatformMetricsCards';
import RecentActivityFeed from '../components/RecentActivityFeed';
import ActiveWorkspacesWidget from '../components/ActiveWorkspacesWidget';
import UsersAccessView from '../components/UsersAccessView';
import RolesView from '../components/RolesView';

export default function SuperAdminPage() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="font-body-base text-on-surface bg-surface min-h-screen">
      <SuperAdminSidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      
      <div className={`w-full min-h-screen flex flex-col ${isSidebarOpen ? 'pl-72' : 'pl-20'}`}>
        <SuperAdminTopbar isSidebarOpen={isSidebarOpen} />

        <main className="relative pt-16 w-full flex-1 overflow-x-hidden">
          {activeNav === 'users-access' ? (
            <UsersAccessView />
          ) : activeNav === 'roles-rbac' ? (
            <RolesView />
          ) : (
            <div className="flex flex-col w-full p-xl gap-xl">
              <div className="flex flex-col gap-xs">
                <h1 className="font-display-title text-on-surface">Dashboard</h1>
                <p className="font-body-base text-on-surface-variant">Platform health and recent activity.</p>
              </div>
              <PlatformMetricsCards />
              <div className="flex flex-col lg:flex-row gap-xl w-full">
                <RecentActivityFeed />
                <ActiveWorkspacesWidget />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
