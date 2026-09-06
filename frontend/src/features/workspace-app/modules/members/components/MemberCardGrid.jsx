export default function MemberCardGrid({
  members,
  currentUserId,
  canManageRoles,
  onOpenMember,
  onOpenDirectMessage,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md w-full">
      {members.map((member) => {
        const isUser = member.id === currentUserId;

        return (
          <div
            key={member.id}
            onClick={() => onOpenMember(member)}
            className={`p-lg rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-md cursor-pointer border ${
              isUser
                ? 'border-2 border-primary/30 hover:border-primary'
                : 'border-border-subtle hover:border-outline'
            }`}
          >
            {/* Top: Avatar, Name, Email, Role */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-label-bold text-sm shadow-xs ${
                      isUser
                        ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {member.initials}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-surface-container-lowest ${
                      member.status === 'Active' ? 'bg-success-text' : 'bg-warning-text'
                    }`}
                    title={member.status}
                  ></span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-label-bold text-label-bold text-on-surface truncate">
                      {member.name}
                    </h3>
                    {isUser && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-fixed shrink-0">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">{member.email}</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 ${
                  member.isTeamAdmin || member.teamRole === 'Team Admin' || member.role === 'Team Admin'
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {member.role}
              </span>
            </div>

            {/* Middle: Department & Status */}
            <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border-subtle text-on-surface-variant">
              <span className="truncate">{member.department}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 ${
                  member.status === 'Active'
                    ? 'bg-success-bg text-success-text'
                    : member.status === 'Suspended'
                    ? 'bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                    : 'bg-warning-bg text-warning-text'
                }`}
              >
                {member.status}
              </span>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70">
              <span className="text-[11px] text-on-surface-variant">Joined {member.joinedDate}</span>
              <div className="flex items-center gap-2">
                {canManageRoles && member.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMember(member);
                    }}
                    className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                    title="Edit Roles & Permissions"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_square</span>
                  </button>
                )}
                {member.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDirectMessage?.(member);
                    }}
                    className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                    title={`Direct message ${member.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </button>
                )}
                <span className="text-label-sm font-label-bold text-primary inline-flex items-center gap-0.5 hover:underline">
                  <span>Profile</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
