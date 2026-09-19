import { CANONICAL_PERMISSIONS } from '@/constants';

export default function RolePermissionsTab({ role, onToggleInspectorPermission }) {
  return (
    <div className="p-lg flex-1 overflow-y-auto space-y-md">
      <div className="bg-surface-container-low p-md rounded-lg flex items-center justify-between">
        <div>
          <span className="font-label-sm text-body-sm text-on-surface-variant block">Access Scope Level</span>
          <span className="text-[12px] text-on-surface-variant">
            {role.permissionKeys?.length || role.perms} permissions attached
          </span>
        </div>
        <span
          className={
            role.scopeType === 'wildcard'
              ? 'px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-[11px]'
              : 'px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-[11px]'
          }
        >
          {role.scopeBadge || 'Scoped'}
        </span>
      </div>

      {role.type === 'system' && (
        <div className="p-sm bg-surface-container-low rounded-lg flex items-center gap-sm text-[12px] text-on-surface-variant border border-border-subtle">
          <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
          <span>System preset permissions are immutable to guarantee baseline platform integrity.</span>
        </div>
      )}

      <div>
        <h4 className="font-label-bold text-label-bold text-on-surface mb-xs">Granular Permission Keys</h4>
        <div className="space-y-xs">
          {CANONICAL_PERMISSIONS.map((permission) => {
            const isGranted =
              role.scopeType === 'wildcard' ||
              (role.permissionKeys || []).includes(permission.key);
            const isEditable = role.type === 'custom';

            return (
              <div
                key={permission.key}
                className={`p-sm rounded-lg flex items-center justify-between shadow-xs border border-border-subtle/40 transition-colors ${
                  isGranted ? 'bg-surface-container-lowest' : 'bg-surface-container-low/40 opacity-60'
                }`}
              >
                <div className="pr-sm">
                  <span className="font-mono font-bold text-label-sm text-on-surface block text-[12px]">
                    {permission.key}
                  </span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">{permission.desc}</span>
                </div>
                {isEditable ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGranted}
                      onChange={() => onToggleInspectorPermission(permission.key)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                ) : isGranted ? (
                  <span className="material-symbols-outlined text-success-text text-[18px]">check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-outline text-[18px]">cancel</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
