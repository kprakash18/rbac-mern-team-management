import { WORKSPACE_ICONS } from './manageUserModel';

function WorkspaceRow({
  availableRoleNames,
  index,
  onRemove,
  onRoleChange,
  onToggleTeamAdmin,
  onWorkspaceChange,
  workspace,
  workspaceOptions,
}) {
  const icon = WORKSPACE_ICONS[workspace.name] || 'corporate_fare';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-md bg-surface-container rounded-lg shadow-sm gap-3">
      <div className="flex items-center gap-sm flex-1 min-w-0">
        <div className="w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <select
            value={workspace.name}
            onChange={(event) => onWorkspaceChange(index, event.target.value)}
            className="w-full appearance-none bg-surface-container-lowest text-on-surface font-label-bold py-1.5 pl-sm pr-8 rounded-lg shadow-sm border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
          >
            {!workspaceOptions.includes(workspace.name) && workspace.name && (
              <option value={workspace.name}>{workspace.name}</option>
            )}
            {workspaceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface cursor-pointer select-none bg-surface-container-lowest px-2.5 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-high transition-colors">
          <input
            type="checkbox"
            checked={Boolean(workspace.isTeamAdmin)}
            onChange={(event) => onToggleTeamAdmin(index, event.target.checked)}
            className="w-3.5 h-3.5 rounded border-border-subtle text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <span className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[14px] text-amber-500">crown</span>
            <span>Team Admin</span>
          </span>
        </label>

        <div className="relative w-36">
          <select
            value={workspace.role}
            onChange={(event) => onRoleChange(index, event.target.value)}
            className="w-full appearance-none bg-surface-container-lowest text-on-surface font-body-sm py-1.5 pl-sm pr-7 rounded-lg shadow-sm border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
          >
            {!availableRoleNames.includes(workspace.role) && workspace.role && (
              <option value={workspace.role}>{workspace.role}</option>
            )}
            {availableRoleNames.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
            arrow_drop_down
          </span>
        </div>

        <button
          type="button"
          aria-label="Remove workspace assignment"
          onClick={() => onRemove(index)}
          className="p-1.5 text-error hover:bg-error-container/50 rounded-lg transition-colors cursor-pointer"
          title="Remove workspace assignment"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  );
}

function WorkspaceAccessSection({
  availableRoleNames,
  onAddWorkspace,
  onRemoveWorkspace,
  onRoleChange,
  onToggleTeamAdmin,
  onWorkspaceChange,
  workspaceOptions,
  workspaces,
}) {
  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <label className="font-label-bold text-on-surface">Workspaces &amp; Roles</label>
        <button
          type="button"
          onClick={onAddWorkspace}
          className="flex items-center gap-xs px-sm py-base bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-bold rounded-lg shadow-sm transition-colors text-[13px] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Workspace
        </button>
      </div>

      <div className="flex flex-col gap-sm">
        {workspaces.length === 0 ? (
          <div className="p-md text-center text-on-surface-variant bg-surface-container rounded-lg font-body-sm">
            No workspaces assigned yet. Click "Add Workspace" to assign.
          </div>
        ) : (
          workspaces.map((workspace, index) => (
            <WorkspaceRow
              key={workspace.id || workspace._id || workspace.name || index}
              availableRoleNames={availableRoleNames}
              index={index}
              onRemove={onRemoveWorkspace}
              onRoleChange={onRoleChange}
              onToggleTeamAdmin={onToggleTeamAdmin}
              onWorkspaceChange={onWorkspaceChange}
              workspace={workspace}
              workspaceOptions={workspaceOptions}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkspaceAccessSection;
