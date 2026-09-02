export const SUPER_ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: 'dashboard' },
  { id: 'workspaces-fleet', label: 'Workspaces & Fleet', icon: 'corporate_fare', path: 'workspaces-fleet' },
  { id: 'users-access', label: 'Users & Access', icon: 'group', path: 'users-access' },
  { id: 'roles-rbac', label: 'Roles & RBAC', icon: 'shield_person', path: 'roles-rbac' },
  { id: 'jit-access', label: 'JIT Access Grants', icon: 'timer', path: 'jit-access' },
  { id: 'security-audit', label: 'Security Audit Logs', icon: 'policy', path: 'security-audit' },
  { id: 'system-broadcasts', label: 'System Broadcasts', icon: 'campaign', path: 'system-broadcasts' },
];

export const MOCK_PLATFORM_METRICS = {
  workspaces: { total: 14, active: 12, archived: 2 },
  users: { total: 148, active: 142, invited: 4, suspended: 2 },
  jitGrants: { active: 5, trending: '+2', percentage: '35%' },
  securityEvents: { today: 28, last24Hours: 'Last 24 hours' },
};

export const MOCK_RECENT_ACTIVITIES = [
  {
    id: 'act-1',
    time: '10:42 AM',
    actor: { name: 'John Doe', initials: 'JD', isSystem: false },
    action: 'Role Assignment',
    target: 'usr_a9f8b7c',
    result: 'Success',
    resultType: 'success',
  },
  {
    id: 'act-2',
    time: '09:15 AM',
    actor: { name: 'System Auto', isSystem: true, icon: 'smart_toy' },
    action: 'JIT Grant Expired',
    target: 'role_db_admin',
    result: 'System',
    resultType: 'system',
  },
  {
    id: 'act-3',
    time: '08:30 AM',
    actor: { name: 'Alice Smith', initials: 'AS', isSystem: false },
    action: 'Workspace Created',
    target: 'ws_marketing_24',
    result: 'Success',
    resultType: 'success',
  },
  {
    id: 'act-4',
    time: 'Yesterday, 18:22',
    actor: { name: 'Unknown IP', initials: 'UK', isError: true },
    action: 'Failed Login Auth',
    target: '192.168.1.44',
    result: 'Failed',
    resultType: 'failed',
  },
  {
    id: 'act-5',
    time: 'Yesterday, 14:05',
    actor: { name: 'John Doe', initials: 'JD', isSystem: false },
    action: 'JIT Request',
    target: 'prod_db_access',
    result: 'Pending',
    resultType: 'pending',
  },
];

export const MOCK_ACTIVE_WORKSPACES = [
  {
    id: 'ws-1',
    name: 'Engineering Core',
    membersCount: 42,
    status: 'Active',
    icon: 'engineering',
  },
  {
    id: 'ws-2',
    name: 'Marketing Global',
    membersCount: 18,
    status: 'Active',
    icon: 'campaign',
  },
  {
    id: 'ws-3',
    name: 'Finance Secure',
    membersCount: 8,
    status: 'High Security',
    icon: 'payments',
  },
  {
    id: 'ws-4',
    name: 'Customer Support EU',
    membersCount: 24,
    status: 'Active',
    icon: 'support_agent',
  },
];
