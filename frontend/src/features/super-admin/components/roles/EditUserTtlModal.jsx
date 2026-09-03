export default function EditUserTtlModal({
  data,
  onClose,
  onChangeData,
  onSave,
}) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-md" id="modal-edit-ttl">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[460px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1100] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Update TTL Expiration</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Modify time-to-live policy for {data.userName}
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

        <div className="p-lg space-y-md">
          <div>
            <label className="block font-label-bold text-label-sm text-on-surface mb-xs">
              Select Expiration Policy
            </label>
            <select
              value={data.ttlType}
              onChange={(e) => onChangeData({ ...data, ttlType: e.target.value })}
              className="w-full h-10 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
            >
              <option value="Permanent">Permanent (Never Expires)</option>
              <option value="14d">14 Days (Sprint Grant)</option>
              <option value="30d">30 Days (Monthly Access)</option>
              <option value="90d">90 Days (Quarterly Audit)</option>
              <option value="custom">Custom Duration...</option>
            </select>
          </div>

          {data.ttlType === 'custom' && (
            <div className="p-sm bg-surface-container-low rounded-xl border border-border-subtle space-y-xs animate-in fade-in-50 duration-150">
              <label className="text-[11px] font-label-bold text-primary block">
                Configure Custom Duration
              </label>
              <div className="flex items-center gap-xs">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={data.customValue}
                    onChange={(e) =>
                      onChangeData({
                        ...data,
                        customValue: e.target.value === '' ? '' : parseInt(e.target.value, 10) || '',
                      })
                    }
                    className="w-full h-8 px-sm bg-surface-container-lowest rounded text-[12px] border border-border-subtle focus:outline-none font-bold"
                    placeholder="e.g. 45"
                    required
                  />
                </div>
                <div className="w-28">
                  <select
                    value={data.customUnit}
                    onChange={(e) => onChangeData({ ...data, customUnit: e.target.value })}
                    className="w-full h-8 px-xs bg-surface-container-lowest rounded text-[12px] border border-border-subtle focus:outline-none cursor-pointer"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[16px]">info</span>
            <span>
              Once expired, the user's role assignment will be automatically revoked unless extended by an admin.
            </span>
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
            type="button"
            className="h-9 px-md rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-bold text-label-sm transition-colors cursor-pointer"
            onClick={onSave}
          >
            Save TTL Policy
          </button>
        </div>
      </div>
    </div>
  );
}
