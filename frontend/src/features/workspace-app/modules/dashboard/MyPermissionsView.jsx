import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useApp } from '@/context/useApp';

export default function MyPermissionsView({ currentUser, workspace }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const [grantedKeys, setGrantedKeys] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!teamId) return;
      try {
        setLoading(true);
        const [myPermsRes, allPermsRes] = await Promise.allSettled([
          api.get(`/api/authorization/permissions?teamId=${teamId}`),
          api.get('/api/permissions'),
        ]);

        if (myPermsRes.status === 'fulfilled') {
          const keys = myPermsRes.value.data?.data?.permissions || [];
          setGrantedKeys(keys);
        }

        if (allPermsRes.status === 'fulfilled') {
          const perms = allPermsRes.value.data?.data?.permissions || allPermsRes.value.data?.data || [];
          setAllPermissions(perms);
        }
      } catch (err) {
        console.error('Failed to load permissions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [teamId]);

  const categoriesMap = {};
  allPermissions.forEach((p) => {
    const cat = p.category || 'General';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push({
      key: p.key,
      name: p.name || p.key,
      description: p.description || p.key,
      granted: grantedKeys.includes(p.key) || grantedKeys.includes('*'),
    });
  });

  const categories = Object.entries(categoriesMap).map(([name, perms]) => ({
    name,
    icon: name === 'Security' ? 'security' : name === 'Admin' ? 'admin_panel_settings' : 'tune',
    permissions: perms,
  }));

  const grantedCount = grantedKeys.length;
  const totalCount = allPermissions.length || grantedCount;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
        <span className="text-[13px] font-medium">Loading permissions...</span>
      </div>
    );
  }

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
          <span className="text-on-primary/70 text-[11px] font-semibold uppercase tracking-widest block">Your Active Role</span>
          <span className="text-[20px] font-bold block">{currentUser?.role || currentUser?.teamRoleTitle || 'Team Member'}</span>
          <span className="text-on-primary/80 text-[12px] block">Permissions dynamically evaluated for this workspace</span>
        </div>
        <div className="ml-auto text-right shrink-0">
          <span className="text-[28px] font-bold block">{grantedCount}</span>
          <span className="text-on-primary/70 text-[11px]">of {totalCount} active</span>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {categories.map((category) => {
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
                        {perm.name || perm.key}
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
