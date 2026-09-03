export default function ChangeWorkspaceModal({
  data,
  onClose,
  onChangeWorkspace,
  onConfirm,
}) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-md" id="modal-edit-workspace">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[460px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1100] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Change Workspace Scope</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Modify workspace boundary for {data.userName}
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
          <div className="p-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface space-y-xs">
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-label-bold text-[12px]">User:</span>
              <span className="font-semibold text-[12px]">{data.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-label-bold text-[12px]">Current Workspace:</span>
              <span className="font-semibold text-[12px] text-primary">{data.currentWorkspace}</span>
            </div>
          </div>

          <div>
            <label className="block font-label-bold text-label-sm text-on-surface mb-xs">
              Select New Workspace:
            </label>
            <select
              value={data.currentWorkspace}
              onChange={(e) => onChangeWorkspace(e.target.value)}
              className="w-full h-10 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
            >
              <option value="Engineering Core">Engineering Core</option>
              <option value="Finance Secure">Finance Secure</option>
              <option value="Marketing Global">Marketing Global</option>
              <option value="Research & Dev">Research & Dev</option>
              <option value="Global Platform">Global Platform</option>
            </select>
          </div>

          <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[16px]">info</span>
            <span>
              The user's role permissions will apply exclusively to resources within the selected workspace boundary.
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
            onClick={onConfirm}
          >
            Update Workspace Scope
          </button>
        </div>
      </div>
    </div>
  );
}
