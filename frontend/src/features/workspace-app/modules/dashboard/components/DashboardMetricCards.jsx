function MetricCard({ icon, label, onClick, subtitle, title, tone = 'primary' }) {
  const hoverClass = tone === 'warning' ? 'hover:border-warning-text/40' : 'hover:border-primary/40';
  const iconClass = tone === 'warning' ? 'text-warning-text' : 'text-on-surface-variant';

  return (
    <div
      onClick={onClick}
      className={`p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer ${hoverClass} transition-colors`}
    >
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
        <span className={`material-symbols-outlined text-[18px] ${iconClass}`}>{icon}</span>
      </div>
      <div className="mt-sm">{title}{subtitle}</div>
    </div>
  );
}

function DashboardMetricCards({ metrics, onNavigate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
      <MetricCard
        icon="key"
        label="Active Capabilities"
        onClick={() => onNavigate?.('my-permissions')}
        title={(
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-md text-[24px] font-semibold text-on-surface">{metrics.capabilitiesCount}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">/ {metrics.totalCapabilities} total</span>
          </div>
        )}
        subtitle={<p className="text-[11px] text-on-surface-variant mt-1 truncate">Granular RBAC privileges</p>}
      />
      <MetricCard
        icon="timer"
        label="Active JIT Grants"
        tone="warning"
        onClick={() => onNavigate?.('jit-request')}
        title={<span className="font-headline-md text-[24px] font-semibold text-on-surface">{metrics.activeJitCount}</span>}
        subtitle={<p className="text-[11px] text-on-surface-variant mt-1 truncate">{metrics.activeJitCount > 0 ? 'Elevated access active' : 'No active elevation leases'}</p>}
      />
      <MetricCard
        icon="group"
        label="Team Directory"
        onClick={() => onNavigate?.('team-members')}
        title={(
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-md text-[24px] font-semibold text-on-surface">{metrics.activeMembersCount}</span>
            <span className="text-[12px] font-medium text-success-text">Members</span>
          </div>
        )}
        subtitle={<p className="text-[11px] text-on-surface-variant mt-1 truncate">Workspace teammates</p>}
      />
      <MetricCard
        icon="task"
        label="Tasks Board"
        onClick={() => onNavigate?.('tasks')}
        title={(
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-md text-[24px] font-semibold text-on-surface">{metrics.tasksCount}</span>
            <span className="text-[12px] font-medium text-on-surface-variant">({metrics.completedTasksCount} done)</span>
          </div>
        )}
        subtitle={<p className="text-[11px] text-on-surface-variant mt-1 truncate">Sprint delivery board</p>}
      />
    </div>
  );
}

export default DashboardMetricCards;
