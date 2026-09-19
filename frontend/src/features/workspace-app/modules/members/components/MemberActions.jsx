function MemberActions({
  canAssignRole,
  canManageMembership,
  currentUserId,
  member,
  onDirectMessage,
  onEditRole,
  onSuspend,
  showSuspend = false,
}) {
  if (member.id === currentUserId) return null;

  return (
    <div className="flex items-center gap-1">
      {canAssignRole && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEditRole(member);
          }}
          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container"
          title="Manage Role"
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
        </button>
      )}
      {showSuspend && canManageMembership && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSuspend(member);
          }}
          className="p-1 rounded text-on-surface-variant hover:text-warning-text hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">
            {member.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDirectMessage?.(member);
        }}
        className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container"
        title="Direct Message"
      >
        <span className="material-symbols-outlined text-[18px]">chat</span>
      </button>
    </div>
  );
}

export default MemberActions;
