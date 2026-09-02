import { MOCK_ACTIVE_WORKSPACES } from '../constants/superAdmin.constants';

export default function ActiveWorkspacesWidget({ workspaces = MOCK_ACTIVE_WORKSPACES }) {
  return (
    <div className="flex-1 lg:w-[35%] flex flex-col gap-md">
      <div className="flex justify-between items-end">
        <h2 className="font-headline-md text-on-surface">Active Workspaces</h2>
        <a className="font-label-bold text-primary hover:text-on-surface-variant transition-colors flex items-center gap-xs" href="#">
          View all
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>
      <div className="bg-card-bg shadow-sm rounded-xl overflow-hidden w-full flex flex-col">
        {workspaces.map((ws, idx) => (
          <div
            key={ws.id}
            className={`p-lg flex items-center justify-between hover:bg-surface-container/30 transition-colors ${
              idx < workspaces.length - 1 ? 'border-b border-border-subtle/50' : ''
            } cursor-pointer group`}
          >
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">{ws.icon || 'engineering'}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-bold text-on-surface">{ws.name}</span>
                <span className="font-body-sm text-on-surface-variant">{ws.membersCount} Members · {ws.status}</span>
              </div>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary px-md py-xs rounded-lg font-label-sm flex items-center gap-xs cursor-pointer">
              Jump In
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-md bg-surface-container/50 rounded-xl p-lg flex items-center gap-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <span className="material-symbols-outlined text-primary text-[32px] relative z-10">info</span>
        <div className="flex flex-col relative z-10">
          <span className="font-label-bold text-on-surface">System Maintenance</span>
          <span className="font-body-sm text-on-surface-variant">Scheduled for Sunday, 02:00 AM UTC. Expect 15m downtime.</span>
        </div>
      </div>
    </div>
  );
}
