import { useState } from 'react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import SuperAdminTopbar from '../components/SuperAdminTopbar';
import PlatformMetricsCards from '../components/PlatformMetricsCards';
import RecentActivityFeed from '../components/RecentActivityFeed';
import ActiveWorkspacesWidget from '../components/ActiveWorkspacesWidget';

export default function SuperAdminPage() {
  const [activeNav, setActiveNav] = useState('dashboard');

  return (
    <div className="font-body-base text-on-surface bg-surface min-h-screen">
      <SuperAdminSidebar activeNav={activeNav} onSelectNav={setActiveNav} />
      <div className="pl-72 w-full min-h-screen flex flex-col">
        <SuperAdminTopbar />
        <main className="relative pt-16 w-full flex-1 overflow-x-hidden">
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
        </main>
      </div>
    </div>
  );
}
