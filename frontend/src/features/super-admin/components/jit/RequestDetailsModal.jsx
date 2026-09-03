export default function RequestDetailsModal({
  request,
  onClose,
  onApprove,
  onOpenReject,
}) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-request-details">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[560px] max-w-[94vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div
              className={`w-10 h-10 rounded-full ${request.user.bgClass} flex items-center justify-center font-label-bold text-label-bold shrink-0 shadow-xs`}
            >
              {request.user.initials}
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <h3 className="font-headline-md text-headline-md text-on-surface">{request.user.name}</h3>
                <span className="text-[11px] text-on-surface-variant font-mono bg-surface-container px-1.5 py-0.5 rounded">
                  {request.ticketId || 'JIT-REQ'}
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                {request.user.email} • {request.user.role || 'Team Member'}
              </p>
            </div>
          </div>
          <button
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-lg space-y-md overflow-y-auto flex-1">
          {/* Elevation Parameters Grid */}
          <div className="grid grid-cols-2 gap-sm p-md bg-surface-container-low rounded-xl border border-border-subtle/50 text-[12px]">
            <div>
              <span className="text-on-surface-variant font-label-bold block text-[11px] mb-0.5">Target Workspace:</span>
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">corporate_fare</span>
                {request.workspace}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant font-label-bold block text-[11px] mb-0.5">Requested Duration:</span>
              <span className="font-mono font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {request.requestedDuration}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant font-label-bold block text-[11px] mb-0.5">Elevated Permission:</span>
              <span className={`px-2 py-0.5 rounded-md font-label-sm text-[11px] font-bold border inline-block ${request.permBadgeClass}`}>
                {request.permission}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant font-label-bold block text-[11px] mb-0.5">Risk Classification:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-label-sm text-[11px] font-bold inline-block ${
                  request.riskLevel === 'HIGH'
                    ? 'bg-error-bg text-error-text border border-error-text/30'
                    : request.riskLevel === 'MEDIUM'
                    ? 'bg-warning-bg text-warning-text border border-warning-text/30'
                    : 'bg-success-bg text-success-text border border-success-text/30'
                }`}
              >
                {request.riskLevel || 'STANDARD'} RISK
              </span>
            </div>
            <div className="col-span-2 pt-xs border-t border-border-subtle/40">
              <span className="text-on-surface-variant font-label-bold block text-[11px] mb-0.5">Target Resource / Cluster:</span>
              <span className="font-mono text-on-surface bg-surface-container-lowest px-2 py-1 rounded border border-border-subtle/60 block truncate">
                {request.targetResource}
              </span>
            </div>
          </div>

          {/* Business Justification Card */}
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-bold text-label-sm text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                <span>Full Business Justification</span>
              </label>
              <span className="text-[11px] text-outline">Submitted {request.submittedAt}</span>
            </div>
            <div className="p-md bg-surface-container-lowest rounded-xl border border-border-subtle text-body-sm text-on-surface leading-relaxed shadow-xs">
              <p className="whitespace-pre-line">{request.reason}</p>
            </div>
          </div>

          {/* Scope Boundary Notice */}
          {request.scopeBoundary && (
            <div className="p-sm bg-surface-container-low rounded-lg text-[11px] text-on-surface-variant flex items-center gap-sm border border-border-subtle">
              <span className="material-symbols-outlined text-primary text-[16px]">verified_user</span>
              <span>
                Access boundary is strictly locked to <strong>{request.scopeBoundary}</strong> and will automatically terminate upon TTL expiration.
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-md bg-surface-container-low flex items-center justify-between border-t border-border-subtle shrink-0">
          <button
            type="button"
            className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
            onClick={onClose}
          >
            Close
          </button>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              className="h-9 px-md rounded-lg text-error hover:bg-error-bg font-label-bold text-label-sm transition-colors cursor-pointer border border-transparent hover:border-error-text/30"
              onClick={() => {
                onClose();
                onOpenReject(request);
              }}
            >
              Reject Request
            </button>
            <button
              type="button"
              className="h-9 px-lg rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              onClick={() => {
                onClose();
                onApprove(request);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Approve &amp; Issue Grant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
