const SCOPE_OPTIONS = [
  { id: 'GLOBAL', label: 'Global Fleet', desc: 'All 18 workspaces (1,240 users)', icon: 'public' },
  { id: 'WORKSPACE_SCOPED', label: 'Workspace Scoped', desc: 'Selected tenant groups', icon: 'corporate_fare' },
  { id: 'ROLE_SCOPED', label: 'Role Scoped', desc: 'Specific privilege tiers', icon: 'shield_person' },
];

function getReachLabel(formData) {
  if (formData.scope === 'GLOBAL') return '~1,240 users across 18 workspaces';
  if (formData.scope === 'ROLE_SCOPED') {
    return `~${Math.max(1, formData.targetRoles.length * 35)} users across ${formData.targetRoles.length} selected role(s)`;
  }
  return `~${Math.max(1, formData.targetWorkspaces.length * 45)} users across ${formData.targetWorkspaces.length} selected workspace(s)`;
}

function BroadcastAudienceStep({ formData, roleNames, updateForm, workspaceNames }) {
  const handleScopeChange = (scope) => {
    let updatedWorkspaces = formData.targetWorkspaces;
    let updatedRoles = formData.targetRoles;

    if (scope === 'WORKSPACE_SCOPED') {
      updatedWorkspaces = formData.targetWorkspaces.filter((workspace) => typeof workspace === 'string' && !workspace.includes('All Workspaces'));
      if (updatedWorkspaces.length === 0) updatedWorkspaces = workspaceNames.length > 0 ? [workspaceNames[0]] : [];
    } else if (scope === 'ROLE_SCOPED') {
      updatedRoles = formData.targetRoles.filter((role) => typeof role === 'string' && !role.includes('All Roles'));
      if (updatedRoles.length === 0) updatedRoles = roleNames.length > 0 ? [roleNames[0]] : [];
    } else {
      updatedWorkspaces = ['All Workspaces'];
      updatedRoles = ['All Roles'];
    }

    updateForm({ scope, targetWorkspaces: updatedWorkspaces, targetRoles: updatedRoles });
  };

  return (
    <div className="space-y-md animate-in fade-in duration-150">
      <div>
        <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
          Delivery Scope Boundary
        </label>
        <div className="grid grid-cols-3 gap-xs">
          {SCOPE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleScopeChange(item.id)}
              className={`p-sm rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                formData.scope === item.id
                  ? 'border-primary bg-primary-fixed/20 shadow-xs'
                  : 'border-border-subtle hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-primary">{item.icon}</span>
              <span className="font-label-bold text-[12px] text-on-surface">{item.label}</span>
              <span className="text-[11px] text-on-surface-variant">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {formData.scope === 'WORKSPACE_SCOPED' && (
        <div>
          <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
            Targeted Workspaces (Multi-Select)
          </label>
          <div className="p-sm bg-surface-container-low rounded-lg space-y-1.5 max-h-40 overflow-y-auto">
            {workspaceNames.map((workspace) => (
              <label key={workspace} className="flex items-center gap-sm text-[12px] font-medium text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.targetWorkspaces.includes(workspace)}
                  onChange={(event) => {
                    updateForm({
                      targetWorkspaces: event.target.checked
                        ? [...formData.targetWorkspaces.filter((item) => !item.includes('All Workspaces')), workspace]
                        : formData.targetWorkspaces.filter((item) => item !== workspace),
                    });
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>{workspace}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {formData.scope === 'ROLE_SCOPED' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-label-bold text-on-surface-variant">
              Targeted Privilege Roles (Multi-Select)
            </label>
            <button
              type="button"
              onClick={() => {
                const isAllSelected = formData.targetRoles.length === roleNames.length;
                updateForm({ targetRoles: isAllSelected ? (roleNames.length > 0 ? [roleNames[0]] : []) : roleNames });
              }}
              className="text-[11px] text-primary underline font-medium cursor-pointer"
            >
              {formData.targetRoles.length === roleNames.length ? 'Deselect All' : 'Select All Roles'}
            </button>
          </div>
          <div className="p-sm bg-surface-container-low rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-border-subtle">
            {roleNames.map((role) => (
              <label key={role} className="flex items-center gap-sm text-[12px] font-medium text-on-surface cursor-pointer p-1 rounded hover:bg-surface-container">
                <input
                  type="checkbox"
                  checked={formData.targetRoles.includes(role)}
                  onChange={(event) => {
                    updateForm({
                      targetRoles: event.target.checked
                        ? [...formData.targetRoles, role]
                        : formData.targetRoles.filter((item) => item !== role),
                    });
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>{role}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant flex items-center gap-sm">
        <span className="material-symbols-outlined text-primary text-[18px]">group</span>
        <span>
          Estimated Reach: <strong>{getReachLabel(formData)}</strong>.
        </span>
      </div>
    </div>
  );
}

export default BroadcastAudienceStep;
