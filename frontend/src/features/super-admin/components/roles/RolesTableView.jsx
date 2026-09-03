export default function RolesTableView({
  roles,
  onOpenDrawer,
  onToggleStatus,
}) {
  return (
    <div className="bg-card-bg rounded-xl shadow-sm overflow-hidden mb-xl" id="roles-table">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low text-label-bold font-label-bold text-body-sm text-on-surface-variant">
            <tr>
              <th className="py-md px-lg">Role Name &amp; Type</th>
              <th className="py-md px-md">Assigned Users</th>
              <th className="py-md px-md">Scope &amp; Permissions</th>
              <th className="py-md px-md">Status</th>
              <th className="py-md px-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-0 text-body-base font-body-base text-on-surface">
            {roles.map((role) => (
              <tr
                key={role.id}
                onClick={() => onOpenDrawer(role)}
                className="hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low last:border-b-0 cursor-pointer"
                title="Click row to view assigned users"
              >
                <td className="py-md px-lg">
                  <div className="flex items-center gap-md">
                    <div className={`w-8 h-8 rounded-lg ${role.iconBg} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                    </div>
                    <div>
                      <div className="font-label-bold text-label-bold text-on-surface">{role.name}</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">{role.subtitle}</div>
                    </div>
                  </div>
                </td>
                <td className="py-md px-md">
                  <button
                    className="font-label-bold text-label-sm text-primary hover:underline cursor-pointer flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDrawer(role, 'members');
                    }}
                  >
                    {role.members} users
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </button>
                </td>
                <td className="py-md px-md">
                  <span className="px-2 py-1 rounded bg-surface-container text-on-surface font-label-sm text-[12px]">
                    {role.permissionKeys?.length || role.perms} Permissions
                  </span>
                </td>
                <td className="py-md px-md">
                  {role.type === 'system' ? (
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[11px] font-semibold">
                      SYSTEM
                    </span>
                  ) : role.status === 'archived' ? (
                    <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-sm text-[11px] font-semibold">
                      ARCHIVED
                    </span>
                  ) : role.status === 'disabled' ? (
                    <span className="px-2 py-0.5 rounded bg-warning-bg text-warning-text font-label-sm text-[11px] font-semibold border border-warning-text/30">
                      DISABLED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-semibold">
                      ACTIVE
                    </span>
                  )}
                </td>
                <td className="py-md px-lg text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-xs">
                    {role.type === 'custom' && role.status !== 'archived' && (
                      <button
                        className="px-2 py-1 rounded-lg bg-surface-container-low text-[11px] font-label-bold hover:bg-surface-container text-on-surface cursor-pointer transition-colors"
                        onClick={() => onToggleStatus(role.id)}
                        title="Toggle Active / Disabled status"
                      >
                        {role.status === 'disabled' ? 'Enable' : 'Disable'}
                      </button>
                    )}
                    <button
                      className="px-sm py-1 rounded-lg bg-surface-container text-label-sm font-label-bold hover:bg-surface-container-high cursor-pointer transition-colors"
                      onClick={() => onOpenDrawer(role, 'permissions')}
                    >
                      Inspect
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
