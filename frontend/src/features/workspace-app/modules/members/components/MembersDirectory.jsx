import { Avatar, Badge, Pagination } from '@/shared/components';
import MemberActions from './MemberActions';

function LoadingMembers() {
  return (
    <div className="py-16 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-border-subtle">
      <span className="material-symbols-outlined animate-spin text-primary text-[32px] block mb-2">progress_activity</span>
      <span>Loading team members...</span>
    </div>
  );
}

function MembersGrid({ actions, currentUserId, members, onSelectMember }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md w-full">
      {members.map((member) => {
        const isUser = member.id === currentUserId;
        return (
          <div
            key={member.id}
            onClick={() => onSelectMember(member)}
            className={`p-lg rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-md cursor-pointer border ${
              isUser ? 'border-2 border-primary/30' : 'border-border-subtle hover:border-outline'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Avatar name={member.name} size="md" status={member.status === 'Active' ? 'online' : 'offline'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-label-bold text-on-surface truncate">{member.name}</h3>
                    {isUser && <Badge variant="primary">YOU</Badge>}
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">{member.email}</p>
                </div>
              </div>
              <Badge variant={member.teamRole === 'Team Admin' ? 'primary' : 'outline'}>{member.role}</Badge>
            </div>

            <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border-subtle text-on-surface-variant">
              <span className="truncate">{member.department}</span>
              <Badge variant={member.status === 'Active' ? 'success' : 'neutral'}>{member.status}</Badge>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70">
              <span className="text-[11px] text-on-surface-variant">Joined {member.joinedDate}</span>
              <MemberActions currentUserId={currentUserId} member={member} {...actions} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MembersTable({ actions, currentUserId, members, onSelectMember }) {
  return (
    <div className="table-wrapper">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="table-head-row">
            <th className="py-3 px-4">Member</th>
            <th className="py-3 px-4">Role</th>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Joined</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-body-sm">
          {members.map((member) => {
            const isUser = member.id === currentUserId;
            return (
              <tr
                key={member.id}
                onClick={() => onSelectMember(member)}
                className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-bold text-on-surface">{member.name}</span>
                        {isUser && <Badge variant="primary">YOU</Badge>}
                      </div>
                      <span className="text-[12px] text-on-surface-variant block">{member.email}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4"><Badge variant="outline">{member.role}</Badge></td>
                <td className="py-3 px-4 text-on-surface-variant">{member.department}</td>
                <td className="py-3 px-4"><Badge variant={member.status === 'Active' ? 'success' : 'neutral'}>{member.status}</Badge></td>
                <td className="py-3 px-4 text-on-surface-variant text-[12px]">{member.joinedDate}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <MemberActions currentUserId={currentUserId} member={member} showSuspend {...actions} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MembersDirectory({
  actions,
  currentPage,
  currentUserId,
  isLoading,
  members,
  pageSize,
  totalMembers,
  totalPages,
  viewMode,
  onPageChange,
  onSelectMember,
}) {
  if (isLoading) return <LoadingMembers />;

  return (
    <>
      {viewMode === 'grid' ? (
        <MembersGrid
          actions={actions}
          currentUserId={currentUserId}
          members={members}
          onSelectMember={onSelectMember}
        />
      ) : (
        <MembersTable
          actions={actions}
          currentUserId={currentUserId}
          members={members}
          onSelectMember={onSelectMember}
        />
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={totalMembers}
        limit={pageSize}
        itemLabel="members"
        loading={isLoading}
        onPageChange={onPageChange}
        className="mt-2"
      />
    </>
  );
}

export default MembersDirectory;
