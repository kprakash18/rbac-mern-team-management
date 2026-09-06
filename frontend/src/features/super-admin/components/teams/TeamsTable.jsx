export default function TeamsTable({
  loading,
  paginatedTeams,
  totalItems,
  startIndex,
  endIndex,
  safeCurrentPage,
  totalPages,
  setCurrentPage,
  onSelectTeamForMembers,
  onSelectTeamForRoles,
  onSelectTeamForOnboarding,
  onOpenEditModal,
  onToggleArchive,
  onJumpIntoWorkspace,
}) {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm border border-border-subtle overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-bold text-label-bold">
              <th className="py-3.5 px-4 font-semibold border-b border-border-subtle min-w-[240px]">Team / Workspace</th>
              <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-28">Status</th>
              <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-32">Members</th>
              <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-32">Created</th>
              <th className="py-3.5 px-4 font-semibold border-b border-border-subtle text-right min-w-[290px]">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center text-on-surface-variant">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    <span>Loading platform teams &amp; workspaces...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedTeams.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center text-on-surface-variant">
                  No teams found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTeams.map((team) => {
                const isArchived = team.status === 'Archived';
                return (
                  <tr key={team.id} className="hover:bg-surface-container-low/50 transition-colors border-b border-border-subtle group">
                    {/* Team Name & Icon */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-sm shrink-0">
                          <span className="material-symbols-outlined text-[18px]">{team.icon}</span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-label-bold text-label-bold text-on-surface truncate max-w-[220px]" title={team.name}>
                            {team.name}
                          </span>
                          <span className="text-on-surface-variant text-[12px] truncate max-w-[260px]" title={team.description}>
                            {team.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {team.status === 'Active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-bg text-success-text text-[11px] font-bold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-text mr-1.5 shrink-0"></span>Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant mr-1.5 shrink-0"></span>Archived
                        </span>
                      )}
                    </td>

                    {/* Members Count */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectTeamForMembers(team)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium transition-colors cursor-pointer"
                        title="View Members"
                      >
                        <span className="material-symbols-outlined text-[15px] text-on-surface-variant">group</span>
                        <span className="font-bold">{team.membersCount}</span>
                        <span className="text-on-surface-variant">Members</span>
                      </button>
                    </td>

                    {/* Created */}
                    <td className="py-3.5 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">{team.createdAt}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTeamForOnboarding(team)}
                          className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 cursor-pointer"
                          title="Onboard Members to Team"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_add</span>
                          <span>Onboard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectTeamForRoles(team)}
                          className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 cursor-pointer"
                          title="Manage Team Roles & Permissions"
                        >
                          <span className="material-symbols-outlined text-[15px]">badge</span>
                          <span>Roles</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(team)}
                          className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                          title="Configure Team"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleArchive(team)}
                          className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                          title={isArchived ? 'Restore Team' : 'Archive Team'}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {isArchived ? 'unarchive' : 'archive'}
                          </span>
                        </button>
                        {!isArchived && (
                          <button
                            type="button"
                            onClick={() => onJumpIntoWorkspace?.(team)}
                            className="px-2.5 py-1 bg-primary text-on-primary font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-on-primary-container transition-all flex items-center gap-1 cursor-pointer"
                            title="Jump into workspace"
                          >
                            <span>Jump In</span>
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="w-full flex items-center justify-between p-3.5 px-4 bg-surface-container-low border-t border-border-subtle">
        <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
          Showing {startIndex} to {endIndex} of {totalItems} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage <= 1}
            className={`px-3 py-1 text-[12px] font-label-bold rounded-lg shadow-2xs transition-colors ${
              safeCurrentPage <= 1
                ? 'bg-surface text-on-surface-variant opacity-50 cursor-not-allowed'
                : 'bg-surface text-on-surface hover:bg-surface-container-high cursor-pointer'
            }`}
          >
            Previous
          </button>
          <span className="font-label-sm text-on-surface-variant px-1 text-[12px]">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage >= totalPages}
            className={`px-3 py-1 text-[12px] font-label-bold rounded-lg shadow-2xs transition-colors ${
              safeCurrentPage >= totalPages
                ? 'bg-surface text-on-surface-variant opacity-50 cursor-not-allowed'
                : 'bg-surface text-on-surface hover:bg-surface-container-high cursor-pointer'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
