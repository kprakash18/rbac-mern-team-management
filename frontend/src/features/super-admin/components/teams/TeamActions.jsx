export default function TeamActions({
  team,
  compact = false,
  onOnboard,
  onManageRoles,
  onEdit,
  onToggleArchive,
  onJumpIntoWorkspace,
}) {
  const isArchived = team.status === 'Archived';

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => onOnboard(team)}
          className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
          title="Onboard Members to Team"
        >
          <span className="material-symbols-outlined text-[14px]">person_add</span>
          <span className="truncate">Onboard</span>
        </button>
        <button
          type="button"
          onClick={() => onManageRoles(team)}
          className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
          title="Manage Team Roles & Permissions"
        >
          <span className="material-symbols-outlined text-[14px]">badge</span>
          <span className="truncate">Roles</span>
        </button>
        <button
          type="button"
          onClick={() => onEdit(team)}
          className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
          title="Edit Team"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
          <span className="truncate">Edit</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onOnboard(team)}
        className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 cursor-pointer"
        title="Onboard Members to Team"
      >
        <span className="material-symbols-outlined text-[15px]">person_add</span>
        <span>Onboard</span>
      </button>
      <button
        type="button"
        onClick={() => onManageRoles(team)}
        className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 cursor-pointer"
        title="Manage Team Roles & Permissions"
      >
        <span className="material-symbols-outlined text-[15px]">badge</span>
        <span>Roles</span>
      </button>
      <button
        type="button"
        onClick={() => onEdit(team)}
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
        <span className="material-symbols-outlined text-[17px]">{isArchived ? 'unarchive' : 'archive'}</span>
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
  );
}
