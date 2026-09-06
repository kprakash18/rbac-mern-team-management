export default function MemberListTable({
  members,
  currentUserId,
  canManageRoles,
  canManageMembers,
  onOpenMember,
  onRemoveMember,
  onSuspendMember,
  onOpenDirectMessage,
}) {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-container-low text-[12px] font-semibold text-on-surface-variant">
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
                onClick={() => onOpenMember(member)}
                className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        isUser ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-bold text-on-surface">{member.name}</span>
                        {isUser && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-primary text-on-primary">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-on-surface-variant block">{member.email}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-on-surface">{member.role}</td>
                <td className="py-3 px-4 text-on-surface-variant">{member.department}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      member.status === 'Active'
                        ? 'bg-success-bg text-success-text'
                        : member.status === 'Suspended'
                        ? 'bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                        : 'bg-warning-bg text-warning-text'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant text-[12px]">{member.joinedDate}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canManageRoles && member.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => onOpenMember(member)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                        title="Manage Member Role"
                      >
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </button>
                    )}
                    {canManageMembers && member.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMember(member);
                        }}
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
                        title="Remove Member from Team"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    )}
                    {canManageMembers && member.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuspendMember(member);
                        }}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          member.status === 'Suspended'
                            ? 'text-success-text hover:bg-success-bg/40'
                            : 'text-on-surface-variant hover:text-warning-text hover:bg-surface-container'
                        }`}
                        title={member.status === 'Suspended' ? `Reactivate ${member.name}` : `Suspend ${member.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {member.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
                        </span>
                      </button>
                    )}
                    {member.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDirectMessage?.(member);
                        }}
                        className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                        title={`Direct message ${member.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </button>
                    )}
                    <span className="text-label-sm font-label-bold text-primary hover:underline inline-flex items-center gap-0.5">
                      <span>Details</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </span>
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
