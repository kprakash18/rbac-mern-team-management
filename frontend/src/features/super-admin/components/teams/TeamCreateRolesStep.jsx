export default function TeamCreateRolesStep({
  availableRoles,
  selectedRoles,
  formSubmitting,
  teamName,
  onToggleRole,
  onSelectAllRoles,
  onBack,
  onNext,
  onSave,
}) {
  return (
    <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
      <div className="p-sm rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-sm">
        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
        <p className="text-body-sm text-on-surface text-[12px] leading-relaxed">
          Select which platform roles to enable for this team workspace. Members onboarded to this team can only be assigned from these enabled roles.
        </p>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-label-bold text-label-sm text-on-surface uppercase tracking-wider">
            Configure Team Roles
          </span>
          <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {selectedRoles.size} of {availableRoles.length} Enabled
          </span>
        </div>

        <button
          type="button"
          onClick={onSelectAllRoles}
          className="text-[11px] font-label-bold px-2 py-1 rounded-md bg-surface-container-highest text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
        >
          {selectedRoles.size === availableRoles.length && availableRoles.length > 0
            ? 'Reset Selection'
            : 'Select All Roles'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-xs max-h-[300px] overflow-y-auto pr-1">
        {availableRoles.map((role) => {
          const roleIdentifier = role.name || role.id;
          const isRoleSelected =
            selectedRoles.has(roleIdentifier) || selectedRoles.has(role.id) || selectedRoles.has(role._id);

          return (
            <div
              key={role.id || role._id || role.name}
              onClick={() => onToggleRole(roleIdentifier)}
              className={`p-sm rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-sm ${
                isRoleSelected
                  ? 'bg-primary/5 border-primary shadow-2xs'
                  : 'bg-surface-container-low border-border-subtle/70 hover:border-border-subtle hover:bg-surface-container opacity-60'
              }`}
            >
              <div className="flex items-center gap-sm min-w-0">
                <input
                  type="checkbox"
                  checked={isRoleSelected}
                  onChange={() => onToggleRole(roleIdentifier)}
                  onClick={(event) => event.stopPropagation()}
                  className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer"
                />

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isRoleSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {role.name?.toLowerCase().includes('admin')
                      ? 'shield_person'
                      : role.name?.toLowerCase().includes('lead')
                      ? 'group_work'
                      : 'badge'}
                  </span>
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-label-bold text-label-sm text-on-surface">
                      {role.name}
                    </span>
                    {role.isSystem && (
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-[10px] text-on-surface-variant font-medium">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-1">
                    {role.description || 'Configured team permission set.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                  {role.permissionCount ?? (role.permissions?.length || 0)} perms
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-label-bold uppercase tracking-wider ${
                    isRoleSelected
                      ? 'bg-success-container/40 text-success'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {isRoleSelected ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-md border-t border-border-subtle mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back</span>
        </button>

        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={onNext}
            className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Next: Add Members</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={formSubmitting || !teamName.trim()}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50"
          >
            {formSubmitting ? 'Saving...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
}
