function DashboardWelcome({ displayName, teamRoleTitle, workspace }) {
  return (
    <div className="w-full rounded-xl bg-surface-container-lowest border border-border-subtle p-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-md">
      <div>
        <div className="flex items-center gap-sm flex-wrap">
          <h1 className="font-display-title text-[22px] font-semibold text-on-surface">
            Welcome back, {displayName}
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
            {teamRoleTitle}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Workspace: {workspace?.name || 'Active Team'} • Role-based access control active
        </p>
      </div>
      <div className="flex items-center gap-sm">
        <div className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-surface-container border border-border-subtle text-on-surface font-label-sm text-label-sm">
          <span className="w-2 h-2 rounded-full bg-success-text"></span>
          <span className="font-label-bold">Session Active</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardWelcome;
