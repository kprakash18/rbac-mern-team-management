function WorkflowItem({ icon, label, meta, muted, onClick, action }) {
  return (
    <div onClick={onClick} className="p-md rounded-lg border border-border-subtle hover:border-outline transition-colors flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-sm">
        <div className={`w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center ${muted ? 'text-on-surface-variant' : 'text-primary'}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div>
          <p className={`font-label-bold text-label-bold text-on-surface ${muted ? '' : 'group-hover:text-primary transition-colors'}`}>{label}</p>
          <p className="text-[11px] text-on-surface-variant">{meta}</p>
        </div>
      </div>
      <span className={`font-label-bold text-label-sm ${muted ? 'text-on-surface-variant' : 'text-primary'} group-hover:underline`}>{action}</span>
    </div>
  );
}

function DashboardQuickWorkflows({ metrics, onNavigate }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm">
      <div className="mb-md">
        <h2 className="font-headline-md text-headline-md text-on-surface">Quick Workflows</h2>
        <p className="text-[12px] text-on-surface-variant">Common workspace actions</p>
      </div>
      <div className="flex flex-col gap-sm">
        <WorkflowItem icon="admin_panel_settings" label="My RBAC Matrix" meta={`${metrics.capabilitiesCount} active capabilities`} action="Review" onClick={() => onNavigate?.('my-permissions')} />
        <WorkflowItem icon="assignment" label="Manage Tasks" meta={`${metrics.tasksCount} total sprint items`} action="Open" onClick={() => onNavigate?.('tasks')} />
        <WorkflowItem muted icon="group" label="Team Directory" meta={`${metrics.activeMembersCount} teammates enrolled`} action="View" onClick={() => onNavigate?.('team-members')} />
      </div>
    </div>
  );
}

export default DashboardQuickWorkflows;
