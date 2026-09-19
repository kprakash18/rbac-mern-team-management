export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'],
  },
  permissions: {
    catalog: () => ['permissions', 'catalog'],
  },
  workspace: {
    bootstrap: (teamId) => ['workspace', teamId, 'bootstrap'],
    bulletins: (teamId) => ['workspace', teamId || 'global', 'bulletins'],
    myTeams: (isSuperAdmin) => ['workspaces', 'my-teams', { isSuperAdmin: Boolean(isSuperAdmin) }],
  },
  team: {
    members: (teamId, params = {}) => ['team', teamId, 'members', params],
    memberList: (teamId) => ['team', teamId, 'member-list'],
    invitations: (teamId) => ['team', teamId, 'invitations'],
  },
  tasks: {
    list: (teamId) => ['team', teamId, 'tasks'],
  },
  superAdmin: {
    workspaces: () => ['super-admin', 'workspaces'],
    userStats: () => ['super-admin', 'user-stats'],
    auditLogs: (limit) => ['super-admin', 'audit-logs', limit],
    accessRequests: () => ['super-admin', 'access-requests'],
  },
};

export default queryKeys;
