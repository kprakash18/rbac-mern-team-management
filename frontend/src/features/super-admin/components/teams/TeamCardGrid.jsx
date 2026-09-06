export default function TeamCardGrid({
  paginatedTeams,
  onSelectTeamForMembers,
  onSelectTeamForRoles,
  onSelectTeamForOnboarding,
  onOpenEditModal,
  onToggleArchive,
  onJumpIntoWorkspace,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {paginatedTeams.map((team) => {
        const isArchived = team.status === 'Archived';
        return (
          <div
            key={team.id}
            className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 border border-border-subtle shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5 min-w-0"
          >
            <div className="flex flex-col gap-2.5 min-w-0">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary font-label-bold flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[19px]">{team.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-bold text-label-bold text-on-surface truncate text-[14px]" title={team.name}>
                      {team.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">{team.createdAt}</span>
                  </div>
                </div>
                {isArchived ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold shadow-2xs shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant mr-1"></span>Archived
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-bg text-success-text text-[10px] font-bold shadow-2xs shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-text mr-1"></span>Active
                  </span>
                )}
              </div>

              <p className="font-body-sm text-[12px] text-on-surface-variant line-clamp-2 min-h-[34px] break-words">
                {team.description || 'Organizational team workspace.'}
              </p>
            </div>

            {/* Structured 2-row footer so buttons never overflow */}
            <div className="pt-3 border-t border-border-subtle flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectTeamForMembers(team)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[12px] font-medium transition-colors cursor-pointer"
                  title="View Members"
                >
                  <span className="material-symbols-outlined text-[15px]">group</span>
                  <span className="font-bold text-on-surface">{team.membersCount}</span>
                  <span>Members</span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleArchive(team)}
                    className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    title={isArchived ? 'Restore Team' : 'Archive Team'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isArchived ? 'unarchive' : 'archive'}
                    </span>
                  </button>
                  {!isArchived ? (
                    <button
                      type="button"
                      onClick={() => onJumpIntoWorkspace?.(team)}
                      className="px-2.5 py-1 bg-primary text-on-primary text-[11px] font-bold rounded-lg shadow-2xs hover:bg-on-primary-container transition-all flex items-center gap-1 cursor-pointer"
                      title="Jump into workspace"
                    >
                      <span>Jump In</span>
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-on-surface-variant px-2 py-0.5 bg-surface-container rounded">
                      Archived
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary Action Toolbar */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectTeamForOnboarding(team)}
                  className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                  title="Onboard Members to Team"
                >
                  <span className="material-symbols-outlined text-[14px]">person_add</span>
                  <span className="truncate">Onboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTeamForRoles(team)}
                  className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                  title="Manage Team Roles & Permissions"
                >
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  <span className="truncate">Roles</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEditModal(team)}
                  className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                  title="Edit Team"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  <span className="truncate">Edit</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
