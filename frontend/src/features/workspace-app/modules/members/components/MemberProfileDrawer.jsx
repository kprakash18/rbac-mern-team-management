export default function MemberProfileDrawer({
  isOpen,
  member,
  currentUserId,
  isTeamAdmin,
  onClose,
  onOpenDirectMessage,
  onStartRoleEdit,
  onToggleSuspend,
  onStartRemove,
}) {
  if (!isOpen || !member) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-on-surface/20 backdrop-blur-[1px] z-40 transition-opacity"
        onClick={onClose}
      ></div>

      <aside className="fixed top-0 right-0 w-full sm:w-105 h-screen bg-surface-container-lowest border-l border-border-subtle shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Drawer Header */}
          <div className="p-md border-b border-border-subtle flex items-center justify-between sticky top-0 bg-surface-container-lowest/95 backdrop-blur z-10">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Member Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-md flex flex-col gap-lg">
            {/* Profile Card */}
            <div className="flex items-center gap-3.5 pb-md border-b border-border-subtle">
              <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-lg shadow-sm">
                {member.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-md text-[18px] font-semibold text-on-surface">
                    {member.name}
                  </h3>
                  {member.id === currentUserId && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-primary text-on-primary">
                      YOU
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-on-surface-variant">{member.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-medium">
                  {member.role}
                </span>
              </div>
            </div>

            {/* Team & Position Info */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-label-bold text-label-bold text-on-surface">Overview</h4>
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Team Role</span>
                  <span className="font-semibold text-on-surface">{member.teamRole}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                  <span className="text-on-surface-variant">Department</span>
                  <span className="font-medium text-on-surface">{member.department}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                  <span className="text-on-surface-variant">Status</span>
                  <span
                    className={`font-semibold ${
                      member.status === 'Active'
                        ? 'text-success-text'
                        : member.status === 'Suspended'
                        ? 'text-zinc-600 dark:text-zinc-400'
                        : 'text-warning-text'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                  <span className="text-on-surface-variant">Joined Workspace</span>
                  <span className="text-on-surface">{member.joinedDate}</span>
                </div>
              </div>
            </div>

            {/* Team Admin Actions */}
            {isTeamAdmin && member.id !== currentUserId && (
              <div className="flex flex-col gap-2.5 pt-md border-t border-border-subtle">
                <h4 className="text-label-bold text-label-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">admin_panel_settings</span>
                  <span>Team Admin Actions</span>
                </h4>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onStartRoleEdit(member)}
                    className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-label-sm font-label-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                    <span>Change Member Role</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSuspend(member.id)}
                    className={`w-full py-2 px-3 rounded-lg text-label-sm font-label-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                      member.status === 'Suspended'
                        ? 'bg-success-bg text-success-text border-success-text/30 hover:bg-success-bg/80'
                        : 'bg-warning-bg/40 text-warning-text border-warning-text/30 hover:bg-warning-bg/70'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {member.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
                    </span>
                    <span>
                      {member.status === 'Suspended' ? 'Reactivate Member' : 'Suspend Member Access'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartRemove(member)}
                    className="w-full py-2 px-3 rounded-lg bg-error-container/30 hover:bg-error-container/60 text-error border border-error/30 text-label-sm font-label-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    <span>Remove from Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-md border-t border-border-subtle bg-surface-container-lowest flex items-center gap-2 sticky bottom-0">
          <button
            type="button"
            onClick={() => {
              onOpenDirectMessage?.(member);
              onClose();
            }}
            className="flex-1 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Send Message</span>
          </button>
          {isTeamAdmin && member.id !== currentUserId && (
            <button
              type="button"
              onClick={() => onStartRoleEdit(member)}
              className="px-md py-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>Manage Role</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
