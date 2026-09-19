function AssignmentRow({
  assignment,
  availableRoleNames,
  canRemove,
  index,
  onRemove,
  onRoleChange,
  onTeamAdminChange,
  onWorkspaceChange,
  roles,
  teams,
  totalAssignments,
  workspaceOptions,
}) {
  return (
    <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-border-subtle flex flex-col gap-2.5">
      <div className="flex gap-md items-end">
        <div className="flex-1 flex flex-col gap-sm relative">
          <label className="font-label-sm text-label-sm text-on-surface-variant">
            Assign to Workspace {totalAssignments > 1 ? `${index + 1}` : ''}
          </label>
          <div className="relative">
            <select
              value={assignment.teamId || assignment.workspace}
              onChange={(event) => onWorkspaceChange(index, event.target.value)}
              className="w-full h-10 pl-sm pr-10 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
            >
              {teams.length > 0 ? (
                teams.map((team) => <option key={team._id || team.id || team.name} value={team._id || team.id}>{team.name}</option>)
              ) : (
                workspaceOptions.map((workspace) => <option key={workspace} value={workspace}>{workspace}</option>)
              )}
            </select>
            <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-sm relative">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Assigned Role</label>
          <div className="relative">
            <select
              value={assignment.roleId || assignment.role}
              onChange={(event) => onRoleChange(index, event.target.value)}
              className="w-full h-10 pl-sm pr-10 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
            >
              {roles.length > 0 ? (
                roles.map((role) => <option key={role._id || role.id || role.name} value={role._id || role.id}>{role.name}</option>)
              ) : (
                availableRoleNames.map((role) => <option key={role} value={role}>{role}</option>)
              )}
            </select>
            <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
          </div>
        </div>

        {canRemove && (
          <button type="button" onClick={() => onRemove(index)} className="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-bg rounded-lg transition-colors cursor-pointer" title="Remove assignment">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-border-subtle/80 flex items-center justify-between">
        <label className="flex items-center gap-2 text-[12px] font-medium text-on-surface cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(assignment.isTeamAdmin)}
            onChange={(event) => onTeamAdminChange(index, event.target.checked)}
            className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-500">crown</span>
            <span className="font-semibold text-on-surface">Assign as Team Admin for {assignment.workspace}</span>
          </span>
        </label>
        {assignment.isTeamAdmin && (
          <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
            Full Workspace Control
          </span>
        )}
      </div>
    </div>
  );
}

function CreateUserAssignmentsSection(props) {
  return (
    <div className="flex flex-col gap-md">
      <h3 className="font-label-bold text-label-bold uppercase tracking-wider text-[11px] text-on-surface-variant">
        Workspace &amp; Role Assignment
      </h3>
      <div className="flex flex-col gap-md">
        {props.assignments.map((assignment, index) => (
          <AssignmentRow
            key={assignment.tempId || assignment.workspace || index}
            assignment={assignment}
            canRemove={props.assignments.length > 1}
            index={index}
            totalAssignments={props.assignments.length}
            {...props}
          />
        ))}
      </div>
      <button type="button" onClick={props.onAddAssignment} className="self-start text-primary font-label-bold text-label-sm hover:underline flex items-center gap-xs mt-xs cursor-pointer">
        <span className="material-symbols-outlined text-[16px]">add</span> Assign to another workspace
      </button>
    </div>
  );
}

export default CreateUserAssignmentsSection;
