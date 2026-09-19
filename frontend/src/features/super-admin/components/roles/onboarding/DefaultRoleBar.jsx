function DefaultRoleBar({
  availableCount,
  availableRoles,
  filterTab,
  selectedRole,
  selectedUserIds,
  onSelectAll,
  onSelectedRoleChange,
}) {
  if (filterTab === 'assigned' || availableCount === 0) return null;

  return (
    <div className="px-lg py-sm bg-surface-container-low/50 border-b border-border-subtle flex items-center justify-between gap-md text-[12px] shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-label-bold text-on-surface">Default Role for Selected:</span>
        <select
          value={selectedRole}
          onChange={(event) => onSelectedRoleChange(event.target.value)}
          className="bg-card-bg text-on-surface px-2.5 py-1 rounded-md border border-border-subtle font-label-bold text-[12px] outline-none cursor-pointer focus:ring-1 focus:ring-primary"
        >
          {availableRoles.map((role) => (
            <option key={role.id || role.name} value={role.name}>
              {role.name} {role.isSystem ? '(System)' : ''}
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={onSelectAll} className="text-primary hover:underline font-label-bold text-[12px] cursor-pointer">
        {selectedUserIds.size === availableCount ? 'Deselect All' : `Select All Available (${availableCount})`}
      </button>
    </div>
  );
}

export default DefaultRoleBar;
