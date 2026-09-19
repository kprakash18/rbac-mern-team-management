import { ConfirmModal } from '@/shared/components';

function JitRejectDialog({
  reason,
  request,
  onClose,
  onConfirm,
  onReasonChange,
}) {
  if (!request) return null;

  return (
    <ConfirmModal
      isOpen={Boolean(request)}
      title="Reject Access Request"
      confirmText="Confirm Rejection"
      confirmVariant="danger"
      icon="cancel"
      onClose={onClose}
      onConfirm={() => onConfirm(request.id, reason)}
    >
      <div className="space-y-3 text-[13px]">
        <div className="p-2.5 bg-surface-container-low rounded-lg text-[12px] text-on-surface space-y-1">
          <div>
            <strong>Requester:</strong> {request.user?.name} ({request.user?.email})
          </div>
          <div>
            <strong>Requested Perm:</strong>{' '}
            <span className="font-mono">{request.permission}</span> on{' '}
            <span className="font-mono">{request.targetResource}</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
            Reason for Rejection
          </label>
          <textarea
            required
            rows="3"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="w-full p-2 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
            placeholder="Explain why this request is being rejected..."
          />
        </div>
      </div>
    </ConfirmModal>
  );
}

export default JitRejectDialog;
