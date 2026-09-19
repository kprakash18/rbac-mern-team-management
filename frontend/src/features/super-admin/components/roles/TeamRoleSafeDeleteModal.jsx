export default function TeamRoleSafeDeleteModal({
  team,
  data,
  replacementRoleOptions,
  loading,
  onChangeData,
  onClose,
  onSubmit,
}) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-lg bg-warning-bg/30 border-b border-warning-text/30 flex items-start gap-md shrink-0">
          <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning-text border border-warning-text/40 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div className="flex-1">
            <span className="px-2 py-0.5 rounded bg-warning-bg text-warning-text font-label-bold text-[10px] uppercase tracking-wider">
              Active Members Safeguard
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface mt-0.5">
              Delete Role &ldquo;{data.roleName}&rdquo; from {team.name}
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

        <form onSubmit={onSubmit} className="p-lg space-y-md overflow-y-auto flex-1">
          <div className="p-sm rounded-xl bg-surface-container-low border border-border-subtle space-y-1 text-body-sm">
            <p className="text-on-surface font-semibold">
              This role is currently assigned to {data.affectedMembers.length} active member(s) in {team.name}.
            </p>
            <p className="text-on-surface-variant text-[12px] leading-relaxed">
              To ensure uninterrupted access and avoid leaving members without permissions, please select a replacement role to reassign them to.
            </p>
          </div>

          <div className="space-y-xs">
            <span className="font-label-bold text-[12px] text-on-surface-variant">Affected Members:</span>
            <div className="max-h-32 overflow-y-auto bg-surface-container-low rounded-xl p-xs space-y-1 border border-border-subtle">
              {data.affectedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-[12px]">
                  <span className="font-medium text-on-surface">{member.name}</span>
                  <span className="text-on-surface-variant text-[11px]">{member.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-xs">
            <label className="block font-label-bold text-label-sm text-on-surface">
              Select Replacement Role <span className="text-error">*</span>
            </label>
            <select
              value={data.replacementRole}
              onChange={(event) =>
                onChangeData((prev) => ({ ...prev, replacementRole: event.target.value }))
              }
              className="w-full h-11 px-md bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              required
            >
              {replacementRoleOptions.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.name} ({role.isSystem ? 'SYSTEM' : 'CUSTOM'}) {role.inTeam ? '- (In Team)' : '- (Platform Role)'}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-md py-xs bg-error text-on-error font-label-bold text-label-sm rounded-lg hover:bg-error/90 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <span>Reassigning &amp; Deleting...</span>
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
