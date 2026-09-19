export default function TeamCreateMembersStep({
  users,
  loading,
  search,
  onSearchChange,
  defaultRole,
  onDefaultRoleChange,
  enabledRoles,
  selectedUsers,
  roleOverrides,
  onToggleUser,
  onSelectAllUsers,
  onRoleOverrideChange,
  onBack,
  onCancel,
  onSave,
  formSubmitting,
  canSave,
}) {
  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-sm bg-surface-container-low p-sm rounded-xl border border-border-subtle">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search active platform users..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface pl-8 pr-3 py-1.5 rounded-lg border border-border-subtle font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-sm shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-on-surface-variant font-label-bold">Default Role:</span>
            <select
              value={defaultRole}
              onChange={(e) => onDefaultRoleChange(e.target.value)}
              className="text-[11px] font-label-bold bg-surface border border-border-subtle rounded-md px-2 py-1 text-on-surface cursor-pointer outline-none"
            >
              {enabledRoles.map((role) => (
                <option key={role.id || role.name} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onSelectAllUsers}
            className="text-[11px] font-label-bold px-2 py-1 rounded-md bg-surface-container-highest text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
          >
            {selectedUsers.size === users.length && users.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-label-bold text-on-surface">
          Active Users ({users.length}) · <span className="text-primary font-normal">{enabledRoles.length} Enabled Team Roles</span>
        </span>
        <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {selectedUsers.size} Selected for Onboarding
        </span>
      </div>

      <div className="space-y-xs max-h-[300px] overflow-y-auto pr-1">
        {loading ? (
          <div className="p-xl text-center text-on-surface-variant text-body-sm">
            Loading active platform users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant text-body-sm">
            No active platform users found to board.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const uid = user._id || user.id;
            const isSelected = selectedUsers.has(uid);
            const initials =
              user.name
                ?.split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U';
            const assignedRole = roleOverrides[uid] || defaultRole;

            return (
              <div
                key={uid}
                onClick={() => onToggleUser(uid)}
                className={`p-sm rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-sm ${
                  isSelected
                    ? 'bg-primary/5 border-primary shadow-2xs'
                    : 'bg-surface-container-low border-border-subtle/70 hover:border-border-subtle hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-sm min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleUser(uid)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-bold text-label-sm text-on-surface block truncate">
                        {user.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-success-container/40 text-success font-label-bold text-[9px] uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant truncate block">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={assignedRole}
                    onChange={(e) => {
                      onRoleOverrideChange(uid, e.target.value);
                      if (!isSelected) onToggleUser(uid);
                    }}
                    className="text-[11px] font-label-bold bg-surface border border-border-subtle rounded-md px-2 py-1 text-on-surface cursor-pointer outline-none focus:border-primary"
                  >
                    {enabledRoles.map((role) => (
                      <option key={role.id || role.name} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
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
            onClick={onCancel}
            className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={formSubmitting || !canSave}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {formSubmitting ? (
              <span>Creating Team...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>
                  {selectedUsers.size > 0
                    ? `Create Team & Add ${selectedUsers.size} Member(s)`
                    : 'Create Team'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
