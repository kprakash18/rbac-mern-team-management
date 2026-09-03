export default function ActiveGrantsTable({
  grants,
  onRevokeGrant,
}) {
  const formatTimer = (seconds) => {
    if (seconds <= 0) return 'EXPIRED';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getTimerPillClass = (seconds) => {
    if (seconds <= 0) {
      return 'flex items-center gap-xs text-on-surface-variant font-mono font-label-bold text-label-bold bg-surface-variant px-sm py-[2px] rounded-full border border-outline w-fit';
    }
    if (seconds < 3600) {
      return 'flex items-center gap-xs text-error font-mono font-label-bold text-label-bold bg-error-bg px-sm py-[2px] rounded-full border border-error-container w-fit';
    }
    if (seconds < 10800) {
      return 'flex items-center gap-xs text-warning-text font-mono font-label-bold text-label-bold bg-warning-bg px-sm py-[2px] rounded-full border border-warning-bg w-fit';
    }
    return 'flex items-center gap-xs text-success-text font-mono font-label-bold text-label-bold bg-success-bg px-sm py-[2px] rounded-full border border-success-bg w-fit';
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-surface-variant">
            <tr>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">User</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Workspace</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Permission</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Target Resource</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Granted By</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Time Remaining</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {grants.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-xl text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-xs">
                    <span className="material-symbols-outlined text-[36px] text-outline">timer_off</span>
                    <span className="font-label-bold text-on-surface">No active JIT access grants</span>
                    <span className="text-[12px]">All temporary access grants have expired or been revoked.</span>
                  </div>
                </td>
              </tr>
            ) : (
              grants.map((grant) => (
                <tr key={grant.id} className="hover:bg-surface-container-lowest transition-colors group">
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div
                        className={`w-8 h-8 rounded-full ${grant.user.bgClass} flex items-center justify-center font-label-bold text-label-bold`}
                      >
                        {grant.user.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-bold text-label-bold text-on-surface">{grant.user.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{grant.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface">{grant.workspace}</td>
                  <td className="px-md py-md">
                    <span
                      className={`px-xs py-[2px] rounded-md font-label-sm text-label-sm border ${grant.permBadgeClass}`}
                    >
                      {grant.permission}
                    </span>
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface font-mono">
                    {grant.targetResource}
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface-variant">{grant.grantedBy}</td>
                  <td className="px-md py-md">
                    <div className={getTimerPillClass(grant.remainingSeconds)}>
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      <span className="live-timer font-mono">{formatTimer(grant.remainingSeconds)}</span>
                    </div>
                  </td>
                  <td className="px-md py-md text-right">
                    <button
                      type="button"
                      onClick={() => onRevokeGrant(grant.id)}
                      className="px-sm py-xs text-error hover:bg-error-container rounded-lg transition-colors flex items-center gap-xs ml-auto opacity-0 group-hover:opacity-100 font-label-sm text-label-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-md py-sm bg-surface-container-low border-t border-surface-variant flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>Showing {grants.length} of {grants.length} active grants</span>
        <div className="flex gap-sm">
          <button className="p-xs rounded hover:bg-surface-container disabled:opacity-50" disabled>
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button className="p-xs rounded hover:bg-surface-container disabled:opacity-50" disabled>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
