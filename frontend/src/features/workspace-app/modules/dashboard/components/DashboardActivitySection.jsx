function DashboardActivitySection({ activities, loading, onNavigate }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm">
      <div className="flex items-center justify-between mb-md">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Recent Workspace Activity</h2>
          <p className="text-[12px] text-on-surface-variant">Live audit trail &amp; events</p>
        </div>
        <button type="button" onClick={() => onNavigate?.('audit-log')} className="font-label-bold text-label-sm text-primary hover:underline cursor-pointer">
          View Audit Log
        </button>
      </div>
      <div className="divide-y divide-border-subtle">
        {loading ? (
          <div className="py-8 text-center text-on-surface-variant text-body-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            <span>Loading recent activity...</span>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="py-3 flex items-start gap-md">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-label-bold text-label-sm ${activity.bgClass || 'bg-surface-container-high text-on-surface'}`}>
                {activity.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-label-bold text-label-bold text-on-surface truncate">{activity.actor}</p>
                  <span className="text-[11px] text-on-surface-variant">{activity.time}</span>
                </div>
                <p className="text-body-sm text-on-surface-variant truncate">{activity.action}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-on-surface-variant text-body-sm flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[32px] text-outline">history</span>
            <p className="font-medium text-on-surface">No recent workspace activity</p>
            <p className="text-[12px] text-on-surface-variant">Activity events and task updates will appear here in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardActivitySection;
