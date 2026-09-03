import { useState } from 'react';

export default function RejectRequestModal({
  request,
  onClose,
  onConfirmReject,
}) {
  const [reason, setReason] = useState('Insufficient business justification or outside operational window.');

  if (!request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmReject(request.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-reject-request">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[460px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-error-bg text-error-text flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Reject Access Request</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Provide reviewer explanation for {request.user.name}
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

        <form onSubmit={handleSubmit}>
          <div className="p-lg space-y-md">
            <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface space-y-1">
              <div>
                <strong>Requester:</strong> {request.user.name} ({request.user.email})
              </div>
              <div>
                <strong>Requested Perm:</strong> <span className="font-mono">{request.permission}</span> on <span className="font-mono">{request.targetResource}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                Reason for Rejection
              </label>
              <textarea
                required
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
                placeholder="Explain why this request is being rejected..."
              />
            </div>
          </div>

          <div className="p-md bg-surface-container-low flex justify-end gap-xs border-t border-border-subtle shrink-0">
            <button
              type="button"
              className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-md rounded-lg bg-error-text text-on-error hover:opacity-90 font-label-bold text-label-sm transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">block</span>
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
