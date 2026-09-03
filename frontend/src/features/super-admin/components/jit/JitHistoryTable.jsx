export default function JitHistoryTable({
  history,
}) {
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
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Authorized / Handled By</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Final Outcome</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant text-right">Ended / Terminated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {history.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-xl text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-xs">
                    <span className="material-symbols-outlined text-[36px] text-outline">history</span>
                    <span className="font-label-bold text-on-surface">No past JIT history records</span>
                    <span className="text-[12px]">Expired and revoked access grants will appear here.</span>
                  </div>
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div
                        className={`w-8 h-8 rounded-full ${record.user.bgClass} flex items-center justify-center font-label-bold text-label-bold`}
                      >
                        {record.user.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-bold text-label-bold text-on-surface">{record.user.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{record.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface">{record.workspace}</td>
                  <td className="px-md py-md">
                    <span
                      className={`px-xs py-[2px] rounded-md font-label-sm text-label-sm border ${record.permBadgeClass}`}
                    >
                      {record.permission}
                    </span>
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface font-mono">
                    {record.targetResource}
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface-variant">
                    {record.grantedBy}
                  </td>
                  <td className="px-md py-md">
                    <span
                      className={`px-sm py-0.5 rounded-full font-mono text-[11px] font-bold border inline-flex items-center gap-1 ${record.outcomeClass}`}
                    >
                      {record.outcome === 'EXPIRED' && <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>}
                      {record.outcome === 'REVOKED' && <span className="w-1.5 h-1.5 rounded-full bg-error-text"></span>}
                      {record.outcome === 'REJECTED' && <span className="w-1.5 h-1.5 rounded-full bg-warning-text"></span>}
                      {record.outcome}
                    </span>
                  </td>
                  <td className="px-md py-md font-body-sm text-[12px] text-on-surface-variant text-right">
                    <span className="block font-medium text-on-surface">{record.endedAt}</span>
                    <span className="text-[11px] text-outline">Lifespan: {record.duration}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-md py-sm bg-surface-container-low border-t border-surface-variant flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>Showing {history.length} audit records</span>
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
