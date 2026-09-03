export default function DeleteRoleModal({
  data,
  roles,
  onClose,
  onChangeTarget,
  onConfirmDelete,
}) {
  if (!data) return null;
  const { role, reassignmentTarget } = data;
  const hasMembers = role.assignedUsers && role.assignedUsers.length > 0;
  const availableTargetRoles = roles.filter((r) => r.id !== role.id && r.status === 'active');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-delete-role">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[460px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-error-bg text-error-text flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Confirm Role Deletion</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Safety validation &amp; active member reassignment
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
          <p className="text-body-sm text-on-surface">
            Are you sure you want to delete and soft-archive custom role{' '}
            <strong className="text-on-surface font-semibold">"{role.name}"</strong>?
          </p>

          {hasMembers ? (
            <div className="p-md bg-warning-bg/40 border border-warning-text/30 rounded-xl space-y-sm">
              <div className="flex items-center gap-xs font-label-bold text-[12px] text-warning-text">
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>Active Member Reassignment Required</span>
              </div>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                There are <strong>{role.assignedUsers.length} active users</strong> currently assigned to this role.
                Select a target baseline role to reassign these users to before proceeding:
              </p>
              <div>
                <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                  Reassign Active Members To:
                </label>
                <select
                  value={reassignmentTarget}
                  onChange={(e) => onChangeTarget(e.target.value)}
                  className="w-full h-9 px-sm bg-surface-container-lowest rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
                >
                  {availableTargetRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.scopeBadge || 'Scoped'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant flex items-center gap-sm">
              <span className="material-symbols-outlined text-outline text-[16px]">check_circle</span>
              <span>No active users assigned to this role. It can be safely soft-archived.</span>
            </div>
          )}
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
            className="h-9 px-md rounded-lg bg-error-text text-on-error hover:opacity-90 font-label-bold text-label-sm transition-colors cursor-pointer flex items-center gap-1"
            onClick={onConfirmDelete}
          >
            <span className="material-symbols-outlined text-[16px]">delete_forever</span>
            <span>Confirm &amp; Delete Role</span>
          </button>
        </div>
      </div>
    </div>
  );
}
