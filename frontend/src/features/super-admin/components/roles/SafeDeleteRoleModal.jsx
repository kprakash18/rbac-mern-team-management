import { useState, useEffect } from 'react';

export default function SafeDeleteRoleModal({
  isOpen,
  role,
  roles = [],
  onClose,
  onConfirmDelete,
  loading = false,
}) {
  const [targetRoleId, setTargetRoleId] = useState('');

  const eligibleRoles = roles.filter(
    (r) => r.id !== role?.id && r.status === 'active' && r.type !== 'archived'
  );

  useEffect(() => {
    if (eligibleRoles.length > 0) {
      setTargetRoleId(eligibleRoles[0].id);
    } else {
      setTargetRoleId('');
    }
  }, [role, roles]);

  if (!isOpen || !role) return null;

  const assignedUsers = role.assignedUsers || [];
  const memberCount = assignedUsers.length || role.members || 0;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (memberCount > 0 && !targetRoleId) return;
    onConfirmDelete(role, targetRoleId);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md" id="modal-safe-delete-role">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div
        className="relative bg-card-bg rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warning Accent */}
        <div className="p-lg bg-error-bg/30 border-b border-error-container/40 flex items-start justify-between gap-md">
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-xl bg-error-bg text-error-text border border-error-container flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <span className="px-2 py-0.5 rounded bg-error-bg text-error-text font-label-bold text-[11px] uppercase tracking-wider">
                  Safeguard Triggered
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mt-0.5">
                Delete Role &ldquo;{role.name}&rdquo;
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-lg space-y-md overflow-y-auto flex-1">
          {/* Warning Message Card */}
          <div className="p-md rounded-xl bg-warning-bg/40 border border-warning-text/30 flex items-start gap-sm text-body-sm text-on-surface">
            <span className="material-symbols-outlined text-warning-text text-[20px] shrink-0 mt-0.5">
              shield_person
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-on-surface">
                {memberCount} active user{memberCount === 1 ? '' : 's'} assigned to this role
              </p>
              <p className="text-on-surface-variant text-[13px] leading-relaxed">
                To prevent orphaned accounts and loss of workspace permissions, all active members must be reassigned to a replacement role before deleting this role.
              </p>
            </div>
          </div>

          {/* Assigned Members Preview */}
          {assignedUsers.length > 0 && (
            <div className="space-y-xs">
              <div className="flex items-center justify-between text-label-sm font-label-bold text-on-surface-variant">
                <span>Affected Members ({assignedUsers.length})</span>
                <span className="text-[11px] font-normal text-outline">Will be reassigned</span>
              </div>
              <div className="max-h-36 overflow-y-auto bg-surface-container-low rounded-xl p-xs space-y-1 border border-border-subtle">
                {assignedUsers.map((u, idx) => {
                  const initials = (u.name || u.email || 'User')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U';

                  return (
                    <div
                      key={u.id || idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest/80 text-body-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <span className="font-medium text-on-surface truncate text-[12px]">{u.name}</span>
                        <span className="text-on-surface-variant text-[11px] truncate">{u.email}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] shrink-0">
                        {u.workspace || 'Workspace'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Destination Role Selector */}
          <div className="space-y-xs">
            <label className="block font-label-bold text-label-sm text-on-surface">
              Select Replacement Role <span className="text-error">*</span>
            </label>
            {eligibleRoles.length === 0 ? (
              <p className="text-error-text text-body-sm">
                No alternative active roles found. Please create another role first before deleting this role.
              </p>
            ) : (
              <select
                value={targetRoleId}
                onChange={(e) => setTargetRoleId(e.target.value)}
                className="w-full h-11 px-md bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-inner"
                required
              >
                {eligibleRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type.toUpperCase()}) - {r.permissionKeys?.length || r.perms || 0} Permissions
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-on-surface-variant">
              All affected members will inherit the permissions of the selected replacement role.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer border border-border-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (memberCount > 0 && eligibleRoles.length === 0)}
              className="px-md py-xs bg-error text-on-error font-label-bold text-label-sm rounded-lg hover:bg-error/90 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin"></div>
                  <span>Migrating &amp; Deleting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Reassign &amp; Delete Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
