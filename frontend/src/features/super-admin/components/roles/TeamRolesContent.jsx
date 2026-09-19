function MemberInitials({ member }) {
  const initials = (member.name || member.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="w-3.5 h-3.5 rounded-full bg-primary-container text-on-primary text-[9px] flex items-center justify-center font-bold shrink-0">
      {initials}
    </span>
  );
}

export default function TeamRolesContent({
  viewMode,
  filteredTeamRoles,
  filteredTeamMembers,
  allPlatformRoles,
  onOpenAddRole,
  onOpenEditRoleMembers,
  onInitiateDeleteRole,
  onAddRoleToMember,
  onRemoveRoleFromMember,
}) {
  return (
    <div className="p-lg overflow-y-auto flex-1 space-y-md bg-surface">
      {viewMode === 'roles' ? (
        filteredTeamRoles.length === 0 ? (
          <div className="p-xl text-center flex flex-col items-center gap-2 bg-card-bg rounded-xl border border-dashed border-border-subtle text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] text-outline">badge</span>
            <p className="font-semibold text-on-surface">No roles match your search.</p>
            <button
              type="button"
              onClick={onOpenAddRole}
              className="mt-2 px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container cursor-pointer"
            >
              + Add Role to Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {filteredTeamRoles.map((role) => (
              <div
                key={role.name}
                className="bg-card-bg rounded-xl p-md border border-border-subtle shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-md"
              >
                <div className="space-y-sm">
                  <div className="flex items-start justify-between gap-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center font-bold shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          {role.isSystem ? 'shield_person' : 'badge'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-headline-md text-on-surface text-[15px] font-bold">{role.name}</h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-label-bold ${
                              role.isSystem
                                ? 'bg-surface-container-high text-on-surface'
                                : 'bg-primary-fixed text-on-primary-fixed'
                            }`}
                          >
                            {role.isSystem ? 'SYSTEM' : 'CUSTOM'}
                          </span>
                        </div>
                        <span className="text-[11px] text-outline block">{role.permissionCount} Permissions</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditRoleMembers(role)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title="Edit members in this role"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onInitiateDeleteRole(role)}
                        className="p-1.5 rounded-lg hover:bg-error-bg text-on-surface-variant hover:text-error-text transition-colors cursor-pointer"
                        title="Delete role from team"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[12px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-subtle/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-label-bold text-on-surface-variant">
                    <span>Assigned Members ({role.membersCount})</span>
                    <button
                      type="button"
                      onClick={() => onOpenEditRoleMembers(role)}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>

                  {role.membersCount === 0 ? (
                    <span className="text-[11px] text-outline italic">No members currently assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {role.members.map((member) => (
                        <span
                          key={member.id || member._id || member.email}
                          className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px] flex items-center gap-1 border border-border-subtle shadow-2xs truncate max-w-[140px]"
                          title={`${member.name} (${member.email})`}
                        >
                          <MemberInitials member={member} />
                          <span className="truncate">{member.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredTeamMembers.length === 0 ? (
        <div className="p-xl text-center flex flex-col items-center gap-2 bg-card-bg rounded-xl border border-dashed border-border-subtle text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] text-outline">group</span>
          <p className="font-semibold text-on-surface">No members match your search.</p>
        </div>
      ) : (
        <div className="space-y-sm">
          {filteredTeamMembers.map((member) => {
            const initials = (member.name || member.email || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
            const memberRoles = member.roles || ['Member'];
            const unassignedRoles = allPlatformRoles.filter((role) => !memberRoles.includes(role.name));

            return (
              <div
                key={member.id || member._id || member.email}
                className="p-md rounded-xl bg-card-bg border border-border-subtle shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-md"
              >
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-[13px] shrink-0">
                    {initials}
                  </div>
                  <div>
                    <span className="font-label-bold text-[14px] text-on-surface font-bold">{member.name}</span>
                    <span className="text-[12px] text-on-surface-variant block">{member.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {memberRoles.map((roleName) => {
                    const isTeamAdmin = roleName.toLowerCase().includes('admin');
                    return (
                      <span
                        key={roleName}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-label-bold flex items-center gap-1.5 shadow-2xs border ${
                          isTeamAdmin
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-surface-container-high text-on-surface border-border-subtle'
                        }`}
                      >
                        {isTeamAdmin && (
                          <span className="material-symbols-outlined text-[13px] text-amber-600">crown</span>
                        )}
                        <span>{roleName}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveRoleFromMember(member, roleName)}
                          className="w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-outline hover:text-error-text transition-colors cursor-pointer ml-0.5"
                          title={`Remove "${roleName}" from ${member.name}`}
                        >
                          <span className="material-symbols-outlined text-[11px]">close</span>
                        </button>
                      </span>
                    );
                  })}

                  {unassignedRoles.length > 0 && (
                    <select
                      value=""
                      onChange={(event) => {
                        if (event.target.value) {
                          onAddRoleToMember(member, event.target.value);
                        }
                      }}
                      className="text-[11px] font-label-bold bg-surface-container hover:bg-surface-container-high text-primary px-2.5 py-1 rounded-lg border border-border-subtle cursor-pointer outline-none transition-colors"
                    >
                      <option value="">+ Assign Role</option>
                      {unassignedRoles.map((role) => (
                        <option key={role.id || role.name} value={role.name}>
                          {role.name} {role.isSystem ? '(System)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
