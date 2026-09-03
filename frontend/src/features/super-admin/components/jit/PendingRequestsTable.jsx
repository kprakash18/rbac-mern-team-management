export default function PendingRequestsTable({
  requests,
  onSelectRequest,
  onApproveRequest,
  onOpenRejectModal,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-surface-variant">
            <tr>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Requester</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Workspace</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Requested Perm</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Target Resource</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Business Justification</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Duration</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant text-right">Decision Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-xl text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-xs">
                    <span className="material-symbols-outlined text-[36px] text-success-text">check_circle</span>
                    <span className="font-label-bold text-on-surface">No pending elevation requests</span>
                    <span className="text-[12px]">All incoming JIT access requests have been reviewed.</span>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="hover:bg-surface-container-low/70 transition-colors cursor-pointer group"
                  title="Click row to view complete business justification"
                >
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div
                        className={`w-8 h-8 rounded-full ${req.user.bgClass} flex items-center justify-center font-label-bold text-label-bold`}
                      >
                        {req.user.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-bold text-label-bold text-on-surface group-hover:text-primary transition-colors">
                          {req.user.name}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{req.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface">{req.workspace}</td>
                  <td className="px-md py-md">
                    <span className={`px-xs py-[2px] rounded-md font-label-sm text-label-sm border ${req.permBadgeClass}`}>
                      {req.permission}
                    </span>
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface font-mono">
                    {req.targetResource}
                  </td>
                  <td className="px-md py-md font-body-sm text-body-sm text-on-surface-variant max-w-xs">
                    <p className="line-clamp-2 text-on-surface" title={req.reason}>
                      {req.reason}
                    </p>
                    <span className="text-[10px] text-outline mt-0.5 block">{req.submittedAt}</span>
                  </td>
                  <td className="px-md py-md">
                    <span className="px-sm py-0.5 rounded-full bg-surface-container font-mono text-[12px] font-semibold text-on-surface">
                      {req.requestedDuration}
                    </span>
                  </td>
                  <td className="px-md py-md text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-xs">
                      <button
                        type="button"
                        onClick={() => onOpenRejectModal(req)}
                        className="px-sm py-1 rounded-lg text-error hover:bg-error-bg text-[12px] font-label-bold transition-colors cursor-pointer border border-transparent hover:border-error-text/30"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onApproveRequest(req)}
                        className="px-md py-1 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed text-[12px] font-label-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-md py-sm bg-surface-container-low border-t border-surface-variant flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>Showing {requests.length} pending requests</span>
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
