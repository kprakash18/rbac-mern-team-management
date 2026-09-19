import { Avatar, Badge, Button } from '@/shared/components';

function MemberDetailsDrawer({
  canAssignRole,
  canManageMembership,
  canRemoveMember,
  currentUserId,
  member,
  onClose,
  onDirectMessage,
  onEditRole,
  onRemove,
  onToggleSuspend,
}) {
  if (!member) return null;

  const isCurrentUser = member.id === currentUserId;

  return (
    <>
      <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-[1px] z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 w-full sm:w-105 h-screen bg-surface-container-lowest border-l border-border-subtle shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          <div className="p-md border-b border-border-subtle flex items-center justify-between sticky top-0 bg-surface-container-lowest/95 backdrop-blur z-10">
            <h2 className="font-headline-md text-on-surface font-semibold">Member Details</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-md flex flex-col gap-lg">
            <div className="flex items-center gap-3.5 pb-md border-b border-border-subtle">
              <Avatar name={member.name} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-md text-[18px] font-semibold text-on-surface">{member.name}</h3>
                  {isCurrentUser && <Badge variant="primary">YOU</Badge>}
                </div>
                <p className="text-body-sm text-on-surface-variant">{member.email}</p>
                <Badge variant="outline" className="mt-1">{member.role}</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <h4 className="text-label-bold text-on-surface">Overview</h4>
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
                  <Badge variant={member.status === 'Active' ? 'success' : 'neutral'}>{member.status}</Badge>
                </div>
                <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                  <span className="text-on-surface-variant">Joined</span>
                  <span className="text-on-surface">{member.joinedDate}</span>
                </div>
              </div>
            </div>

            {(canAssignRole || canManageMembership || canRemoveMember) && !isCurrentUser && (
              <div className="flex flex-col gap-2.5 pt-md border-t border-border-subtle">
                <h4 className="text-label-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">admin_panel_settings</span>
                  <span>Management Actions</span>
                </h4>
                <div className="flex flex-col gap-2">
                  {canAssignRole && (
                    <Button variant="outline" icon="badge" onClick={() => onEditRole(member)}>
                      Change Member Role
                    </Button>
                  )}
                  {canManageMembership && (
                    <Button
                      variant="outline"
                      icon={member.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
                      onClick={() => onToggleSuspend(member.id)}
                    >
                      {member.status === 'Suspended' ? 'Reactivate Member' : 'Suspend Member Access'}
                    </Button>
                  )}
                  {canRemoveMember && (
                    <Button variant="danger" icon="person_remove" onClick={() => onRemove(member)}>
                      Remove from Workspace
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-md border-t border-border-subtle bg-surface-container-lowest flex items-center gap-2 sticky bottom-0">
          <Button
            className="flex-1"
            icon="chat"
            onClick={() => {
              onDirectMessage?.(member);
              onClose();
            }}
          >
            Send Message
          </Button>
        </div>
      </aside>
    </>
  );
}

export default MemberDetailsDrawer;
