import { MY_PERMISSIONS } from '@/constants';

export default function MyPermissionsView() {
  const grantedCount = MY_PERMISSIONS.categories.reduce(
    (sum, cat) => sum + cat.permissions.filter(p => p.granted).length, 0
  );
  const totalCount = MY_PERMISSIONS.categories.reduce(
    (sum, cat) => sum + cat.permissions.length, 0
  );

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
        <div>
          <h2 className="text-[22px] font-bold text-on-surface">My Permissions</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">
            Your current access rights based on your assigned role.
          </p>
        </div>
        <div className="flex items-center gap-xs text-[12px] text-on-surface-variant">
          <span className="w-3 h-3 rounded-full bg-success-text inline-block"></span>
          <span>Granted ({grantedCount})</span>
          <span className="ml-2 w-3 h-3 rounded-full bg-border-subtle inline-block"></span>
          <span>Denied ({totalCount - grantedCount})</span>
        </div>
      </div>

      {/* Role Card */}
      <div className="bg-primary rounded-2xl p-md text-on-primary flex items-center gap-md shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-on-primary/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: '"FILL" 1' }}>shield_person</span>
        </div>
        <div>
          <span className="text-on-primary/70 text-[11px] font-semibold uppercase tracking-widest block">Your Assigned Role</span>
          <span className="text-[20px] font-bold block">{MY_PERMISSIONS.roleName}</span>
          <span className="text-on-primary/80 text-[12px] block">{MY_PERMISSIONS.roleDescription}</span>
        </div>
        <div className="ml-auto text-right shrink-0">
          <span className="text-[28px] font-bold block">{grantedCount}</span>
          <span className="text-on-primary/70 text-[11px]">of {totalCount} granted</span>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {MY_PERMISSIONS.categories.map((category) => {
          const catGranted = category.permissions.filter(p => p.granted).length;
          return (
            <div
              key={category.name}
              className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-xs overflow-hidden"
            >
              {/* Category Header */}
              <div className="p-md border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary">{category.icon}</span>
                  <span className="font-bold text-on-surface text-[14px]">{category.name}</span>
                </div>
                <span className="text-[12px] text-on-surface-variant">
                  {catGranted}/{category.permissions.length}
                </span>
              </div>

              {/* Permissions List */}
              <div className="divide-y divide-border-subtle">
                {category.permissions.map((perm) => (
                  <div key={perm.key} className="flex items-center justify-between px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <span className={`material-symbols-outlined text-[16px] ${perm.granted ? 'text-success-text' : 'text-outline'}`}
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        {perm.granted ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={`text-[13px] font-medium ${perm.granted ? 'text-on-surface' : 'text-on-surface-variant line-through opacity-60'}`}>
                        {perm.label}
                      </span>
                    </div>
                    <code className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                      {perm.key}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
