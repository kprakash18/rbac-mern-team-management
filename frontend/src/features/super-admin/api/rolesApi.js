import api from '@/lib/api';

export const ROLE_TEMPLATES = {
  developer: [
    'task.read',
    'task.create',
    'task.update',
    'team.read',
    'membership.read',
    'access_request.create',
    'access_request.cancel',
    'notification.read',
    'notification.update',
  ],
  'ws-admin': [
    'user.read',
    'user.create',
    'user.update',
    'team.read',
    'team.update',
    'membership.read',
    'membership.create',
    'membership.update',
    'membership.remove',
    'task.read',
    'task.create',
    'task.update',
    'task.delete',
    'access_request.read',
    'access_request.approve',
    'access_request.reject',
    'notification.read',
    'notification.update',
  ],
  auditor: [
    'user.read',
    'team.read',
    'membership.read',
    'role.read',
    'permission.read',
    'audit.read',
    'access_grant.read',
  ],
};

function getRoleTheme(roleName, isSystem) {
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
}

export function formatRole(role) {
  const isSystem = Boolean(role.isSystemRole || role.type === 'system');
  const roleName = role.name || 'Custom Role';
  const theme = getRoleTheme(roleName, isSystem);
  const rawPerms = Array.isArray(role.permissions) ? role.permissions : [];
  const permissionKeys = rawPerms
    .map((permission) => (typeof permission === 'string' ? permission : permission?.key))
    .filter(Boolean);
  const assignedUsers = Array.isArray(role.assignedUsers) ? role.assignedUsers : [];
  const bgColors = [
    'bg-indigo-100 text-indigo-800',
    'bg-emerald-100 text-emerald-800',
    'bg-amber-100 text-amber-800',
    'bg-blue-100 text-blue-800',
  ];

  const avatars = assignedUsers.slice(0, 3).map((user, index) => {
    const initials =
      (user.name || user.email || 'User')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';

    return { text: initials, bg: bgColors[index % bgColors.length] };
  });

  return {
    id: role._id || role.id,
    name: roleName,
    subtitle: role.description || (isSystem ? 'System core role definition' : 'Custom RBAC role'),
    desc: role.description || (isSystem ? 'System core role definition' : 'Custom RBAC role definition'),
    type: isSystem ? 'system' : 'custom',
    status: (role.status || 'ACTIVE').toLowerCase(),
    icon: role.icon || theme.icon,
    iconBg: role.iconBg || theme.iconBg,
    members: assignedUsers.length,
    membersCount: assignedUsers.length,
    perms: permissionKeys.length,
    permissionKeys,
    rawPermissions: rawPerms,
    avatars,
    permPills: [
      { text: `${permissionKeys.length} Permissions`, dot: true },
      { text: isSystem ? 'Global Scope' : 'Workspace Scope' },
    ],
    assignedUsers,
    createdAt: role.createdAt,
  };
}

export async function getRolesCatalogData() {
  const [rolesRes, permsRes, teamsRes] = await Promise.allSettled([
    api.get('/api/roles?status=all'),
    api.get('/api/permissions'),
    api.get('/api/teams?status=all'),
  ]);

  const permissions =
    permsRes.status === 'fulfilled' && permsRes.value.data?.data
      ? permsRes.value.data.data
      : [];
  const rawTeams =
    teamsRes.status === 'fulfilled'
      ? teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || []
      : [];
  const rawRoles =
    rolesRes.status === 'fulfilled' ? rolesRes.value.data?.data || [] : [];

  return {
    permissions,
    workspaces: rawTeams,
    roles: Array.isArray(rawRoles) ? rawRoles.map(formatRole) : [],
  };
}

export async function createRole(payload) {
  const res = await api.post('/api/roles', payload);
  return res.data?.data;
}

export async function updateRole(roleId, payload) {
  const res = await api.patch(`/api/roles/${roleId}`, payload);
  return res.data?.data;
}

export async function updateRoleStatus(roleId, status) {
  return api.patch(`/api/roles/${roleId}`, { status });
}

export async function archiveRole(roleId) {
  return api.delete(`/api/roles/${roleId}`);
}

export async function restoreRole(roleId) {
  return api.patch(`/api/roles/${roleId}`, { status: 'ACTIVE' });
}

export async function deleteRole(roleId, payload) {
  return api.delete(`/api/roles/${roleId}`, payload ? { data: payload } : undefined);
}
