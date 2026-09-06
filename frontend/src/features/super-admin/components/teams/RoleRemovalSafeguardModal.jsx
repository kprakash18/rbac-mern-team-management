export default function RoleRemovalSafeguardModal({
  roleRemovalData,
  onClose,
  availableRoles,
  roleRemovalLoading,
  onConfirmReassignment,
  setRoleRemovalData,
}) {
  if (!roleRemovalData) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative bg-card-bg rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Header */}
        <div className="p-lg bg-warning-bg/30 border-b border-warning-text/30 flex items-start gap-md">
          <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning-text border border-warning-text/40 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div className="flex-1">
            <span className="px-2 py-0.5 rounded bg-warning-bg text-warning-text font-label-bold text-[10px] uppercase tracking-wider">
              Active Role Removal Safeguard
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface mt-0.5">
              Reassign Active Role
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onConfirmReassignment} className="p-lg space-y-md">
          <div className="p-sm rounded-xl bg-surface-container-low border border-border-subtle space-y-1 text-body-sm">
            <p className="text-on-surface font-semibold">
              {roleRemovalData.member?.name} is losing their primary role &ldquo;{roleRemovalData.roleToRemove}&rdquo;.
            </p>
            <p className="text-on-surface-variant text-[12px] leading-relaxed">
              To prevent orphaned members and ensure uninterrupted workspace permissions in <strong>{roleRemovalData.team?.name}</strong>, please select a replacement role.
            </p>
          </div>

          <div className="space-y-xs">
            <label className="block font-label-bold text-label-sm text-on-surface">
              Select Replacement Role <span className="text-error">*</span>
            </label>
            <select
              value={roleRemovalData.replacementRole}
              onChange={(e) =>
                setRoleRemovalData((prev) => ({ ...prev, replacementRole: e.target.value }))
              }
              className="w-full h-10 px-sm bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              required
            >
              {availableRoles
                .filter((r) => r.name !== roleRemovalData.roleToRemove)
                .map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={roleRemovalLoading}
              className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={roleRemovalLoading}
              className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {roleRemovalLoading ? (
                <span>Reassigning...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Reassign &amp; Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
