export default function TeamEditRolesStep({
  team,
  availableRoles,
  onAddMemberRole,
  onRemoveMemberRole,
  onDone,
}) {
  return (
    <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
      <div className="flex items-center justify-between pb-xs border-b border-border-subtle">
        <div>
          <h3 className="font-label-bold text-label-bold text-on-surface">Workspace Member Roles</h3>
          <p className="font-body-sm text-[12px] text-on-surface-variant">
            Assign, reassign, or remove roles for members within this team workspace.
          </p>
        </div>
      </div>

      <div className="space-y-sm">
        {(!team.members || team.members.length === 0) ? (
          <div className="p-lg text-center text-on-surface-variant">
            No members assigned to this team yet.
          </div>
        ) : (
          team.members.map((member) => {
            const initials =
              member.name
                ?.split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U';
            const memberRoles = member.roles || ['Member'];

            return (
              <div
                key={member.id || member._id || member.email}
                className="p-md rounded-xl bg-surface-container-low border border-border-subtle/60 flex flex-col gap-xs"
              >
                <div className="flex items-center justify-between gap-md">
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="truncate">
                      <span className="font-label-bold text-label-sm text-on-surface block truncate">
                        {member.name}
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate block">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <select
                    value=""
                    onChange={(event) => {
                      if (event.target.value) {
                        onAddMemberRole(team, member, event.target.value);
                      }
                    }}
                    className="text-[11px] font-label-bold bg-surface-container-highest text-on-surface px-2 py-1 rounded-md border border-border-subtle cursor-pointer outline-none"
                  >
                    <option value="">+ Assign Role</option>
                    {availableRoles
                      .filter((role) => !memberRoles.includes(role.name))
                      .map((role) => (
                        <option key={role.id || role.name} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {memberRoles.map((roleName) => (
                    <span
                      key={roleName}
                      className="px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface text-[11px] font-label-sm flex items-center gap-1 border border-border-subtle shadow-2xs"
                    >
                      <span>{roleName}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveMemberRole(team, member, roleName)}
                        className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center text-outline hover:text-error-text cursor-pointer"
                        title={`Remove "${roleName}"`}
                      >
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-end pt-md border-t border-border-subtle mt-auto">
        <button
          type="button"
          onClick={onDone}
          className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
