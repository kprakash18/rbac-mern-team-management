export default function ReassignUserModal({
  data,
  roles,
  onClose,
  onChangeTarget,
  onConfirm,
}) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-md" id="modal-reassign-user">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[460px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1100] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Reassign User Role</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Move {data.user.name} to another role
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
              <span className="font-semibold text-[12px]">{data.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-label-bold text-[12px]">Current Role:</span>
              <span className="font-semibold text-[12px] text-primary">{data.sourceRole.name}</span>
            </div>
          </div>

          <div>
            <label className="block font-label-bold text-label-sm text-on-surface mb-xs">
              Select Destination Role:
            </label>
            <select
              value={data.targetRoleId}
              onChange={(e) => onChangeTarget(e.target.value)}
              className="w-full h-10 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
            >
              {roles
                .filter((r) => r.id !== data.sourceRole.id && r.status === 'active')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.scopeBadge || 'Scoped'})
                  </option>
                ))}
            </select>
          </div>

          <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[16px]">info</span>
            <span>
              The user will be immediately unassigned from "{data.sourceRole.name}" and granted permissions for the new role.
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
            className="h-9 px-md rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-bold text-label-sm transition-colors cursor-pointer flex items-center gap-1"
            onClick={onConfirm}
          >
            <span>Confirm Reassignment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
