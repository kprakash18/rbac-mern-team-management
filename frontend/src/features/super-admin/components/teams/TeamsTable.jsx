import { Pagination } from '@/shared/components';
import TeamActions from './TeamActions';
import TeamStatusBadge from './TeamStatusBadge';

export default function TeamsTable({
  teams,
  loading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onOpenMembers,
  onOnboard,
  onManageRoles,
  onEdit,
  onToggleArchive,
  onJumpIntoWorkspace,
}) {
  return (
    <div className="table-wrapper">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead>
            <tr className="table-head-row">
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
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center text-on-surface-variant">
                  No teams found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className="hover:bg-surface-container-low/50 transition-colors border-b border-border-subtle group">
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

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <TeamStatusBadge status={team.status} />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenMembers(team)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium transition-colors cursor-pointer"
                      title="View Members"
                    >
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant">group</span>
                      <span className="font-bold">{team.membersCount}</span>
                      <span className="text-on-surface-variant">Members</span>
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">{team.createdAt}</td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <TeamActions
                      team={team}
                      onOnboard={onOnboard}
                      onManageRoles={onManageRoles}
                      onEdit={onEdit}
                      onToggleArchive={onToggleArchive}
                      onJumpIntoWorkspace={onJumpIntoWorkspace}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        itemLabel="teams"
        loading={loading}
        onPageChange={onPageChange}
        className="rounded-t-none border-t-0"
      />
    </div>
  );
}
