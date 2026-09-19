function UserRoleSelect({ availableRoles, assignedRole, onChange }) {
  return (
    <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      <span className="text-[11px] text-on-surface-variant font-label-bold">Role:</span>
      <select
        value={assignedRole}
        onChange={(event) => onChange(event.target.value)}
        className="bg-surface-container text-on-surface text-[11px] font-label-bold px-2 py-1 rounded-md border border-border-subtle outline-none cursor-pointer"
      >
        {availableRoles.map((role) => (
          <option key={role.id || role.name} value={role.name}>{role.name}</option>
        ))}
      </select>
    </div>
  );
}

function OnboardingUserRow({
  availableRoles,
  selectedRole,
  selectedUserIds,
  user,
  userRoleOverrides,
  onSetUserRole,
  onToggleUser,
}) {
  const initials = (user.name || user.email || 'U').split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase();
  const isSelected = selectedUserIds.has(user.id);
  const assignedRole = userRoleOverrides[user.id] || selectedRole;

  return (
    <div
      onClick={() => {
        if (!user.isAlreadyAssigned) onToggleUser(user.id);
      }}
      className={`p-md rounded-xl border transition-all flex items-center justify-between gap-md ${
        user.isAlreadyAssigned
          ? 'bg-surface-container-low/40 border-border-subtle/50 opacity-80 cursor-default'
          : isSelected
          ? 'bg-primary-fixed/20 border-primary shadow-xs cursor-pointer'
          : 'bg-card-bg hover:bg-surface-container border-border-subtle cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-md min-w-0">
        {user.isAlreadyAssigned ? (
          <div className="w-5 h-5 rounded bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-primary">check</span>
          </div>
        ) : (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleUser(user.id)}
            onClick={(event) => event.stopPropagation()}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle cursor-pointer shrink-0"
          />
        )}

        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-[12px] shrink-0">
          {initials}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-label-bold text-on-surface text-[13px] truncate font-bold">{user.name}</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-label-bold text-[10px]">ACTIVE</span>
          </div>
          <span className="text-[12px] text-on-surface-variant truncate">{user.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {user.isAlreadyAssigned ? (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-label-bold border border-border-subtle">Already Member</span>
            <div className="flex items-center gap-1">
              {user.currentRoles.map((role) => (
                <span key={role} className="px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">{role}</span>
              ))}
            </div>
          </div>
        ) : isSelected ? (
          <UserRoleSelect
            availableRoles={availableRoles}
            assignedRole={assignedRole}
            onChange={(roleName) => onSetUserRole(user.id, roleName)}
          />
        ) : (
          <span className="text-[11px] text-outline italic">Click to select</span>
        )}
      </div>
    </div>
  );
}

function OnboardingUsersList({
  availableRoles,
  filteredUsers,
  loadingUsers,
  selectedRole,
  selectedUserIds,
  userRoleOverrides,
  onSetUserRole,
  onToggleUser,
}) {
  return (
    <div className="p-lg overflow-y-auto flex-1 space-y-sm bg-surface">
      {loadingUsers ? (
        <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
          <span className="text-body-sm">Loading active platform users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-xl text-center flex flex-col items-center gap-2 bg-card-bg rounded-xl border border-dashed border-border-subtle text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] text-outline">person_search</span>
          <p className="font-semibold text-on-surface">No users match your filter.</p>
          <p className="text-[12px]">All active users may already be assigned or no search results found.</p>
        </div>
      ) : (
        <div className="space-y-xs">
          {filteredUsers.map((user) => (
            <OnboardingUserRow
              key={user.id}
              availableRoles={availableRoles}
              selectedRole={selectedRole}
              selectedUserIds={selectedUserIds}
              user={user}
              userRoleOverrides={userRoleOverrides}
              onSetUserRole={onSetUserRole}
              onToggleUser={onToggleUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default OnboardingUsersList;
