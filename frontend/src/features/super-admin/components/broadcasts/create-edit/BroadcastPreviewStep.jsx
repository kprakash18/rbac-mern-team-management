import { BROADCAST_TYPES } from '@/constants';

function getAudienceLabel(formData) {
  if (formData.scope === 'GLOBAL') return 'Global Fleet (All 18 workspaces)';
  if (formData.scope === 'ROLE_SCOPED') return `Roles (${formData.targetRoles.join(', ')})`;
  return `Workspaces (${formData.targetWorkspaces.join(', ')})`;
}

function BroadcastPreviewStep({ formData }) {
  const currentTypeConfig = BROADCAST_TYPES[formData.type] || BROADCAST_TYPES.OUTAGE;

  return (
    <div className="space-y-md animate-in fade-in duration-150">
      <div>
        <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
          Live Client-Facing Sticky Banner Preview
        </label>
        <div className={`p-md rounded-xl shadow-sm flex items-center justify-between gap-sm border ${currentTypeConfig.badgeClass}`}>
          <div className="flex items-center gap-sm min-w-0">
            <span className="material-symbols-outlined text-[20px] shrink-0">
              {currentTypeConfig.icon}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-bold text-[13px] text-on-surface truncate">
                {formData.title || 'Broadcast Title'}
              </span>
              <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                {formData.message || 'Announcement message preview...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-xs shrink-0">
            {formData.ctaLabel && (
              <span className="px-sm py-0.5 rounded text-[11px] font-bold underline cursor-pointer">
                {formData.ctaLabel}
              </span>
            )}
            <button
              type="button"
              className="px-sm py-1 rounded-lg bg-primary text-on-primary text-[11px] font-label-bold"
            >
              {formData.ackMode === 'MANDATORY_ACK' ? 'Acknowledge' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-md bg-surface-container-low rounded-lg text-[12px] space-y-1">
        <div><strong>Type:</strong> {currentTypeConfig.label} ({formData.severity})</div>
        <div><strong>Audience:</strong> {getAudienceLabel(formData)}</div>
        <div><strong>Mode:</strong> {formData.ackMode}</div>
      </div>
    </div>
  );
}

export default BroadcastPreviewStep;
