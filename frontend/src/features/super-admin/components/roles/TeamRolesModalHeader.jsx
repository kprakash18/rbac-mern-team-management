export default function TeamRolesModalHeader({
  team,
  roleCount,
  onOpenOnboarding,
  onOpenAddRole,
  onClose,
}) {
  return (
    <div className="p-lg bg-surface-container-low border-b border-border-subtle flex items-center justify-between gap-md shrink-0">
      <div className="flex items-center gap-md">
        <div className="w-11 h-11 rounded-xl bg-primary text-on-primary font-label-bold flex items-center justify-center shadow-xs shrink-0">
          <span className="material-symbols-outlined text-[24px]">badge</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {team.name} Roles &amp; Permissions
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-bold text-[11px]">
              {roleCount} Roles Active
            </span>
          </div>
          <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
            Manage roles, assign team members, and configure workspace RBAC policies for this team.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-sm">
        <button
          type="button"
          onClick={onOpenOnboarding}
          className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-primary hover:text-on-primary flex items-center gap-1.5 transition-all cursor-pointer text-[13px]"
          title="Onboard active platform users to team"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Onboard Members</span>
        </button>
        <button
          type="button"
          onClick={onOpenAddRole}
          className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center gap-1.5 transition-colors cursor-pointer text-[13px]"
        >
          <span className="material-symbols-outlined text-[18px]">add_moderator</span>
          <span>Add Role to Team</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  );
}
