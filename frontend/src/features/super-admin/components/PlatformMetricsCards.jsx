export default function PlatformMetricsCards({ metrics = {} }) {
  const {
    workspaces = { total: 0, active: 0, archived: 0 },
    users = { total: 0, active: 0, invited: 0, suspended: 0 },
    jitGrants = { active: 0, trending: '0', percentage: '0%' },
    securityEvents = { today: 0, last24Hours: 'Last 24 hours' },
  } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md w-full">
      {/* 1. Workspaces */}
      <div className="bg-card-bg shadow-sm rounded-xl p-lg flex flex-col gap-md h-full transition-transform hover:-translate-y-1 duration-300">
        <div className="p-sm bg-primary-container/10 rounded-lg w-fit">
          <span className="material-symbols-outlined text-primary-container text-[24px]">corporate_fare</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Workspaces</span>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-title text-on-surface">{workspaces.total}</span>
            <span className="font-body-sm text-on-surface-variant">Total</span>
          </div>
        </div>
        <div className="flex gap-sm mt-auto pt-sm border-t border-border-subtle/30">
          <span className="font-label-sm text-success-text flex items-center gap-base">
            <span className="w-1.5 h-1.5 rounded-full bg-success-text"></span>{workspaces.active} Active
          </span>
          <span className="font-label-sm text-on-surface-variant flex items-center gap-base">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span>{workspaces.archived} Archived
          </span>
        </div>
      </div>

      {/* 2. Users */}
      <div className="bg-card-bg shadow-sm rounded-xl p-lg flex flex-col gap-md h-full transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="p-sm bg-tertiary-container/10 rounded-lg w-fit relative z-10">
          <span className="material-symbols-outlined text-tertiary-container text-[24px]">group</span>
        </div>
        <div className="flex flex-col gap-xs relative z-10">
          <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Users</span>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-title text-on-surface" id="user-count">{users.total}</span>
            <span className="font-body-sm text-on-surface-variant">Total</span>
          </div>
        </div>
        <div className="flex gap-sm mt-auto pt-sm border-t border-border-subtle/30 relative z-10 flex-wrap">
          <span className="font-label-sm text-success-text flex items-center gap-base">
            <span className="w-1.5 h-1.5 rounded-full bg-success-text"></span>{users.active} Active
          </span>
          <span className="font-label-sm text-warning-text flex items-center gap-base">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-text"></span>{users.invited} Invited
          </span>
          <span className="font-label-sm text-error-text flex items-center gap-base">
            <span className="w-1.5 h-1.5 rounded-full bg-error-text"></span>{users.suspended} Suspended
          </span>
        </div>
      </div>

      {/* 3. JIT Grants */}
      <div className="bg-card-bg shadow-sm rounded-xl p-lg flex flex-col gap-md h-full transition-transform hover:-translate-y-1 duration-300">
        <div className="flex justify-between items-start">
          <div className="p-sm bg-secondary-container/30 rounded-lg">
            <span className="material-symbols-outlined text-on-secondary-container text-[24px]">timer</span>
          </div>
          <span className="px-xs py-base bg-warning-bg text-warning-text rounded-full font-label-sm flex items-center gap-base">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>{jitGrants.trending}
          </span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">JIT Grants</span>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-title text-on-surface">{jitGrants.active}</span>
            <span className="font-body-sm text-on-surface-variant">Active</span>
          </div>
        </div>
        <div className="mt-auto pt-sm border-t border-border-subtle/30">
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div className="bg-secondary-container h-1.5 rounded-full w-[35%]"></div>
          </div>
          <span className="font-label-sm text-on-surface-variant mt-xs block">{jitGrants.percentage} vs avg day</span>
        </div>
      </div>

      {/* 4. Security Events */}
      <div className="bg-card-bg shadow-sm rounded-xl p-lg flex flex-col gap-md h-full transition-transform hover:-translate-y-1 duration-300">
        <div className="p-sm bg-error-container/30 rounded-lg w-fit">
          <span className="material-symbols-outlined text-on-error-container text-[24px]">policy</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Security Events</span>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-title text-on-surface">{securityEvents.today}</span>
            <span className="font-body-sm text-on-surface-variant">Today</span>
          </div>
        </div>
        <div className="mt-auto pt-sm border-t border-border-subtle/30 flex justify-between items-center">
          <span className="font-label-sm text-on-surface-variant">{securityEvents.last24Hours}</span>
          <svg className="w-16 h-6 text-on-error-container/50" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 64 24">
            <polyline points="0,20 10,18 20,22 30,10 40,15 50,5 64,12"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
}
