/**
 * Shared Role domain helpers, theming, and template definitions.
 */

export const ROLE_TEMPLATES = {
  developer: [
    'task.read', 'task.create', 'task.update',
    'team.read', 'membership.read',
    'access_request.create', 'access_request.cancel',
    'notification.read', 'notification.update',
  ],
  'ws-admin': [
    'user.read', 'user.create', 'user.update',
    'team.read', 'team.update',
    'membership.read', 'membership.create', 'membership.update', 'membership.remove',
    'task.read', 'task.create', 'task.update', 'task.delete',
    'access_request.read', 'access_request.approve', 'access_request.reject',
    'notification.read', 'notification.update',
  ],
  auditor: [
    'user.read', 'team.read', 'membership.read', 'role.read', 'permission.read',
    'audit.read', 'access_grant.read',
  ],
};

export const getRoleTheme = (roleName, isSystem) => {
  const name = (roleName || '').toLowerCase();
  if (isSystem || name.includes('admin') || name.includes('owner')) {
    return { icon: 'shield_person', iconBg: 'bg-indigo-100 text-indigo-700' };
  }
  if (name.includes('sec') || name.includes('audit') || name.includes('compliance')) {
    return { icon: 'security', iconBg: 'bg-emerald-100 text-emerald-700' };
  }
  if (name.includes('lead') || name.includes('manager')) {
    return { icon: 'badge', iconBg: 'bg-amber-100 text-amber-700' };
  }
  if (name.includes('dev') || name.includes('engineer') || name.includes('arch')) {
    return { icon: 'terminal', iconBg: 'bg-blue-100 text-blue-700' };
  }
  if (name.includes('data') || name.includes('scientist') || name.includes('ai')) {
    return { icon: 'dataset', iconBg: 'bg-cyan-100 text-cyan-700' };
  }
  return { icon: 'groups', iconBg: 'bg-purple-100 text-purple-700' };
};

export function formatRole(r) {
  const isSystem = Boolean(r.isSystemRole || r.type === 'system');
  const roleName = r.name || 'Custom Role';
  const theme = getRoleTheme(roleName, isSystem);

  const rawPerms = Array.isArray(r.permissions) ? r.permissions : [];
  const permissionKeys = rawPerms.map((p) => (typeof p === 'string' ? p : p?.key)).filter(Boolean);

  const assignedUsers = Array.isArray(r.assignedUsers) ? r.assignedUsers : [];
  const avatars = assignedUsers.slice(0, 3).map((u, i) => {
    const initials = (u.name || u.email || 'User').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const bgColors = [
      'bg-indigo-100 text-indigo-800',
      'bg-emerald-100 text-emerald-800',
      'bg-amber-100 text-amber-800',
      'bg-blue-100 text-blue-800',
    ];
    return { text: initials, bg: bgColors[i % bgColors.length] };
  });

  const permPills = [
    { text: `${permissionKeys.length} Permissions`, dot: true },
    { text: isSystem ? 'Global Scope' : 'Workspace Scope' },
  ];

  return {
    id: r._id || r.id,
    name: roleName,
    subtitle: r.description || (isSystem ? 'System core role definition' : 'Custom RBAC role'),
    desc: r.description || (isSystem ? 'System core role definition' : 'Custom RBAC role definition'),
    type: isSystem ? 'system' : 'custom',
    status: (r.status || 'ACTIVE').toLowerCase(),
    icon: r.icon || theme.icon,
    iconBg: r.iconBg || theme.iconBg,
    members: assignedUsers.length,
    membersCount: assignedUsers.length,
    perms: permissionKeys.length,
    permissionKeys,
    rawPermissions: rawPerms,
    avatars,
    permPills,
    assignedUsers,
    createdAt: r.createdAt,
  };
}
