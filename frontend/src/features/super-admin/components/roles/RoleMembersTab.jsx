export default function RoleMembersTab({
  role,
  users,
  searchQuery,
  onSearchChange,
  isAssignFormOpen,
  onToggleAssignForm,
  assignFormData,
  onAssignFormChange,
  workspaces,
  defaultWorkspace,
  onSubmitAssign,
  onOpenEditWorkspace,
  onOpenEditTtl,
  onOpenReassignUser,
  onUnassignUser,
}) {
  return (
    <div className="p-lg flex-1 overflow-y-auto space-y-md">
      <div className="flex items-center gap-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[18px]">search</span>
          <input
            className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Filter users by name, email, workspace..."
            type="text"
          />
        </div>
        <button
          type="button"
          className={`h-9 px-md rounded-lg font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
            isAssignFormOpen
              ? 'bg-surface-container-high text-on-surface'
              : 'bg-primary text-on-primary hover:bg-primary-container'
          }`}
          onClick={onToggleAssignForm}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isAssignFormOpen ? 'remove' : 'person_add'}
          </span>
          <span>{isAssignFormOpen ? 'Close' : 'Assign'}</span>
        </button>
      </div>

      {isAssignFormOpen && (
        <form
          onSubmit={onSubmitAssign}
          className="p-md bg-surface-container-low rounded-xl border border-border-subtle space-y-sm animate-in fade-in-50 duration-150"
        >
          <div className="flex items-center justify-between pb-xs border-b border-border-subtle">
            <span className="font-label-bold text-label-sm text-on-surface">
              Assign New User to {role.name}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Step 1 of 1</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <div>
              <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                Full Name
              </label>
              <input
                required
                type="text"
                value={assignFormData.name}
                onChange={(event) => onAssignFormChange({ ...assignFormData, name: event.target.value })}
                placeholder="e.g. Alex Morgan"
                className="w-full h-8 px-sm bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                Email Address
              </label>
              <input
                required
                type="email"
                value={assignFormData.email}
                onChange={(event) => onAssignFormChange({ ...assignFormData, email: event.target.value })}
                placeholder="alex.m@company.com"
                className="w-full h-8 px-sm bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <div>
              <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                Workspace Scope
              </label>
              <select
                value={assignFormData.workspace}
                onChange={(event) => onAssignFormChange({ ...assignFormData, workspace: event.target.value })}
                className="w-full h-8 px-xs bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none cursor-pointer"
              >
                {(workspaces.length > 0 ? workspaces : [{ id: defaultWorkspace, name: defaultWorkspace }]).map((workspace) => {
                  const name = typeof workspace === 'string' ? workspace : workspace.name;
                  return (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                TTL Policy
              </label>
              <select
                value={assignFormData.ttlType}
                onChange={(event) => onAssignFormChange({ ...assignFormData, ttlType: event.target.value })}
                className="w-full h-8 px-xs bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none cursor-pointer"
              >
                <option value="Permanent">Permanent (No Expiry)</option>
                <option value="14d">14 Days (Sprint Grant)</option>
                <option value="30d">30 Days (Monthly Access)</option>
                <option value="90d">90 Days (Quarterly Audit)</option>
                <option value="custom">Custom Duration...</option>
              </select>
            </div>
          </div>

          {assignFormData.ttlType === 'custom' && (
            <div className="p-xs bg-surface-container-lowest rounded-lg border border-border-subtle space-y-xs animate-in fade-in-50 duration-150">
              <label className="text-[11px] font-label-bold text-primary block">
                Configure Custom Duration
              </label>
              <div className="flex items-center gap-xs">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={assignFormData.customTtlValue}
                    onChange={(event) =>
                      onAssignFormChange({
                        ...assignFormData,
                        customTtlValue: event.target.value === '' ? '' : parseInt(event.target.value, 10) || '',
                      })
                    }
                    className="w-full h-8 px-sm bg-surface-container-low rounded text-[12px] border border-border-subtle focus:outline-none font-bold"
                    placeholder="e.g. 45"
                    required
                  />
                </div>
                <div className="w-28">
                  <select
                    value={assignFormData.customTtlUnit}
                    onChange={(event) => onAssignFormChange({ ...assignFormData, customTtlUnit: event.target.value })}
                    className="w-full h-8 px-xs bg-surface-container-low rounded text-[12px] border border-border-subtle focus:outline-none cursor-pointer"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-primary">info</span>
                <span>
                  Grant will expire in <strong>{assignFormData.customTtlValue || '...'} {assignFormData.customTtlUnit}</strong> from assignment date.
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-xs">
            <button
              type="submit"
              className="h-8 px-md rounded-md bg-primary text-on-primary font-label-bold text-[12px] cursor-pointer hover:bg-primary-container transition-colors"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      )}

      <div className="space-y-xs">
        {users.length === 0 ? (
          <div className="py-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] text-outline mb-xs">group_off</span>
            <p className="text-body-sm text-on-surface font-semibold">No matching users</p>
            <p className="text-[12px] text-on-surface-variant">Click "+ Assign" above to assign users to this role.</p>
          </div>
        ) : (
          <>
            {users.map((user) => (
              <div
                key={user.id}
                className="p-md rounded-xl bg-surface-container-low flex items-center justify-between gap-sm hover:bg-surface-container transition-colors border border-border-subtle/40"
              >
                <div className="flex items-center gap-sm">
                  <div
                    className={`w-9 h-9 rounded-full ${user.bg || 'bg-primary text-on-primary'} flex items-center justify-center font-label-bold text-[12px] shrink-0`}
                  >
                    {user.initials || 'U'}
                  </div>
                  <div>
                    <div className="font-label-bold text-label-sm text-on-surface">{user.name}</div>
                    <div className="font-body-sm text-[12px] text-on-surface-variant">{user.email}</div>
                    <div className="flex items-center gap-xs mt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenEditWorkspace(user)}
                        className="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-[10px] font-medium flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="Click to change workspace scope"
                      >
                        <span>{user.workspace || 'Default'}</span>
                        <span className="material-symbols-outlined text-[11px] text-outline">edit</span>
                      </button>
                      <span className="text-outline text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={() => onOpenEditTtl(user)}
                        className="text-[10px] text-on-surface-variant hover:text-primary flex items-center gap-0.5 cursor-pointer px-1 py-0.5 rounded hover:bg-surface-container-high transition-colors"
                        title="Click to update TTL expiration"
                      >
                        <span className="material-symbols-outlined text-[12px] text-primary">schedule</span>
                        <span>{user.ttl || 'Permanent'}</span>
                        <span className="material-symbols-outlined text-[11px] text-outline">edit</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-xs shrink-0">
                  <button
                    className="h-8 px-xs rounded-lg hover:bg-surface-container text-on-surface font-label-sm text-[12px] flex items-center gap-1 transition-colors cursor-pointer border border-border-subtle"
                    title="Reassign to another role"
                    onClick={() => onOpenReassignUser(user)}
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">swap_horiz</span>
                    <span>Reassign</span>
                  </button>
                  <button
                    className="h-8 px-xs rounded-lg hover:bg-error-bg text-error-text font-label-sm text-[12px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="Revoke / Unassign role"
                    onClick={() => onUnassignUser(user.id)}
                  >
                    <span className="material-symbols-outlined text-[16px]">person_remove</span>
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            ))}

            {role.id === 'dev' && (
              <div className="p-sm bg-surface-container-lowest rounded-lg border border-dashed border-border-subtle text-center text-[12px] text-on-surface-variant">
                + 102 additional workspace developers holding active scoped tokens.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
