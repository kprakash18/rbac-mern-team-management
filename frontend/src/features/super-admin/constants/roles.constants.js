// Canonical Permissions Catalog across 9 system categories
export const CANONICAL_PERMISSIONS = [
  // 1. Users
  { key: 'user.read', category: 'USERS', desc: 'View user profiles, identity records, and security status.' },
  { key: 'user.create', category: 'USERS', desc: 'Invite or create new user identities in the workspace.' },
  { key: 'user.update', category: 'USERS', desc: 'Update user profiles, emails, and account attributes.' },
  { key: 'user.delete', category: 'USERS', desc: 'Deactivate, soft-delete, or suspend user identities.' },

  // 2. Teams & Workspaces
  { key: 'team.read', category: 'TEAMS', desc: 'View workspace and team details, telemetry, and node status.' },
  { key: 'team.create', category: 'TEAMS', desc: 'Provision new workspace namespaces and project squads.' },
  { key: 'team.update', category: 'TEAMS', desc: 'Update team settings, workspace configurations, and limits.' },
  { key: 'team.delete', category: 'TEAMS', desc: 'Archive or permanently decommission workspace namespaces.' },

  // 3. Memberships
  { key: 'membership.read', category: 'MEMBERSHIPS', desc: 'List active and pending memberships in workspaces.' },
  { key: 'membership.create', category: 'MEMBERSHIPS', desc: 'Add members to workspaces and teams.' },
  { key: 'membership.update', category: 'MEMBERSHIPS', desc: 'Modify membership tiers, status, and metadata.' },
  { key: 'membership.remove', category: 'MEMBERSHIPS', desc: 'Remove members from workspaces and teams.' },

  // 4. Roles & RBAC
  { key: 'role.read', category: 'ROLES', desc: 'Inspect role definitions, assigned members, and scopes.' },
  { key: 'role.create', category: 'ROLES', desc: 'Create bespoke custom RBAC roles.' },
  { key: 'role.update', category: 'ROLES', desc: 'Modify custom role metadata, names, and descriptions.' },
  { key: 'role.delete', category: 'ROLES', desc: 'Decommission and soft-archive custom roles.' },
  { key: 'role.assign', category: 'ROLES', desc: 'Assign roles to workspace members.' },
  { key: 'role.revoke', category: 'ROLES', desc: 'Revoke assigned roles from workspace members.' },

  // 5. Granular Permissions
  { key: 'permission.read', category: 'PERMISSIONS', desc: 'View all 35 canonical permission definitions.' },
  { key: 'permission.assign', category: 'PERMISSIONS', desc: 'Attach granular permission keys to custom roles.' },

  // 6. Tasks & Projects
  { key: 'task.read', category: 'TASKS', desc: 'View tasks, project boards, and sprint backlog items.' },
  { key: 'task.create', category: 'TASKS', desc: 'Create new tasks, work items, and sprint deliverables.' },
  { key: 'task.update', category: 'TASKS', desc: 'Update task properties, assignees, priorities, and status.' },
  { key: 'task.delete', category: 'TASKS', desc: 'Delete tasks and work items.' },

  // 7. Security Audit & Telemetry
  { key: 'audit.read', category: 'AUDIT', desc: 'Inspect immutable security audit logs and trails.' },

  // 8. JIT Access & Elevated Requests
  { key: 'access_request.read', category: 'ACCESS_REQUESTS', desc: 'Inspect pending Just-In-Time access elevation requests.' },
  { key: 'access_request.create', category: 'ACCESS_REQUESTS', desc: 'Submit temporary access elevation requests.' },
  { key: 'access_request.approve', category: 'ACCESS_REQUESTS', desc: 'Approve pending JIT access requests.' },
  { key: 'access_request.reject', category: 'ACCESS_REQUESTS', desc: 'Reject pending JIT access requests.' },
  { key: 'access_request.cancel', category: 'ACCESS_REQUESTS', desc: 'Cancel self-submitted access requests.' },
  { key: 'access_grant.read', category: 'ACCESS_REQUESTS', desc: 'View active time-bound JIT access grants.' },
  { key: 'access_grant.create', category: 'ACCESS_REQUESTS', desc: 'Issue direct temporary access grants with TTL.' },
  { key: 'access_grant.revoke', category: 'ACCESS_REQUESTS', desc: 'Prematurely revoke active time-bound access grants.' },

  // 9. System Notifications & Broadcasts
  { key: 'notification.read', category: 'NOTIFICATIONS', desc: 'Read notifications, activity mentions, and security alerts.' },
  { key: 'notification.update', category: 'NOTIFICATIONS', desc: 'Acknowledge, dismiss, or configure alerts.' },
];

export const CATEGORY_LABELS = {
  USERS: '1. Identity & Users',
  TEAMS: '2. Teams & Workspaces',
  MEMBERSHIPS: '3. Team Memberships',
  ROLES: '4. Roles & RBAC',
  PERMISSIONS: '5. Granular Permissions',
  TASKS: '6. Tasks & Projects',
  AUDIT: '7. Security & Audit Logs',
  ACCESS_REQUESTS: '8. JIT Elevation & Access Grants',
  NOTIFICATIONS: '9. Notifications & Broadcasts',
};

export const permissionsByCategory = CANONICAL_PERMISSIONS.reduce((acc, perm) => {
  if (!acc[perm.category]) acc[perm.category] = [];
  acc[perm.category].push(perm);
  return acc;
}, {});

export const INITIAL_ROLES = [
  {
    id: 'super-admin',
    name: 'Platform Super Admin',
    type: 'system',
    status: 'active',
    members: 3,
    perms: 35,
    icon: 'shield_person',
    iconBg: 'bg-surface-container-high',
    desc: 'Unrestricted wildcard access across all workspaces, platform authority settings, fleet nodes, and audit logs.',
    scopeType: 'wildcard',
    scopeBadge: 'Wildcard Platform Authority',
    subtitle: 'Wildcard security tier',
    avatars: [
      { text: 'JD', bg: 'bg-primary text-on-primary' },
      { text: 'SK', bg: 'bg-secondary-container text-on-secondary-container' },
      { text: 'AL', bg: 'bg-surface-container-highest text-on-surface' },
    ],
    permPills: [
      { text: 'Wildcard * (All 35)', dot: true },
      { text: 'System Broadcasts (Full)' },
      { text: 'JIT Grant Approver' },
    ],
    permissionKeys: CANONICAL_PERMISSIONS.map((p) => p.key),
    assignedUsers: [
      { id: 'usr-101', name: 'John Doe', email: 'john.doe@company.com', workspace: 'Global Platform', assignedAt: 'Jan 10, 2024', ttl: 'Permanent', initials: 'JD', bg: 'bg-primary text-on-primary' },
      { id: 'usr-102', name: 'Sarah Koenig', email: 'skoenig@company.com', workspace: 'Global Platform', assignedAt: 'Feb 14, 2024', ttl: 'Permanent', initials: 'SK', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-103', name: 'Alex Lee', email: 'alex.lee@company.com', workspace: 'Global Platform', assignedAt: 'Mar 01, 2024', ttl: 'Permanent', initials: 'AL', bg: 'bg-surface-container-highest text-on-surface' },
    ],
  },
  {
    id: 'ws-admin',
    name: 'Workspace Admin',
    type: 'system',
    status: 'active',
    members: 5,
    perms: 13,
    icon: 'corporate_fare',
    iconBg: 'bg-surface-container',
    desc: 'Complete authority within assigned workspaces, including team memberships, role assignments, and project configurations.',
    scopeType: 'standard',
    scopeBadge: 'Scoped Namespace Access',
    subtitle: 'Team & workspace authority',
    avatars: [
      { text: 'MR', bg: 'bg-secondary-container text-on-secondary-container' },
      { text: 'TL', bg: 'bg-surface-container-highest text-on-surface' },
      { text: '+3', bg: 'bg-primary text-on-primary' },
    ],
    permPills: [
      { text: 'User Management (4)' },
      { text: 'Team Settings (3)' },
      { text: 'Task Controls (4)' },
      { text: 'Workspace Audit (2)' },
    ],
    permissionKeys: [
      'user.read', 'team.read', 'team.update', 'membership.read', 'membership.create', 'membership.update', 'membership.remove',
      'role.read', 'role.assign', 'role.revoke', 'task.read', 'task.create', 'task.update', 'task.delete', 'audit.read',
    ],
    assignedUsers: [
      { id: 'usr-201', name: 'Michael Reed', email: 'mreed@engineering.corp', workspace: 'Engineering Core', assignedAt: 'Jan 15, 2024', ttl: 'Permanent', initials: 'MR', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-202', name: 'Tina Liu', email: 'tina.l@marketing.corp', workspace: 'Marketing Global', assignedAt: 'Feb 01, 2024', ttl: 'Permanent', initials: 'TL', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-203', name: 'Robert Fox', email: 'rfox@finance.corp', workspace: 'Finance Secure', assignedAt: 'Mar 12, 2024', ttl: 'Expires in 30d', initials: 'RF', bg: 'bg-primary text-on-primary' },
      { id: 'usr-204', name: 'Samantha Vance', email: 'svance@engineering.corp', workspace: 'Engineering Core', assignedAt: 'Apr 04, 2024', ttl: 'Permanent', initials: 'SV', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-205', name: 'Derrick Hall', email: 'dhall@research.corp', workspace: 'Research & Dev', assignedAt: 'May 10, 2024', ttl: 'Expires in 90d', initials: 'DH', bg: 'bg-surface-container-highest text-on-surface' },
    ],
  },
  {
    id: 'dev',
    name: 'Team Member / Developer',
    type: 'system',
    status: 'active',
    members: 112,
    perms: 9,
    icon: 'terminal',
    iconBg: 'bg-surface-container',
    desc: 'Standard read-write access to workspace repositories, deployment pipelines, task boards, and incident reporting.',
    scopeType: 'standard',
    scopeBadge: 'Scoped Namespace Access',
    subtitle: 'Developer engineering tier',
    avatars: [
      { text: 'DA', bg: 'bg-surface-container-highest text-on-surface' },
      { text: 'EK', bg: 'bg-secondary-container text-on-secondary-container' },
      { text: '+110', bg: 'bg-primary text-on-primary' },
    ],
    permPills: [
      { text: 'Repo Read/Write (4)' },
      { text: 'CI/CD Trigger (2)' },
      { text: 'Issue Tracking (3)' },
    ],
    permissionKeys: [
      'team.read', 'membership.read', 'role.read', 'permission.read', 'access_request.read', 'access_request.create', 'access_request.cancel',
      'task.read', 'task.create', 'task.update', 'notification.read',
    ],
    assignedUsers: [
      { id: 'usr-301', name: 'David Adams', email: 'dadams@eng.io', workspace: 'Engineering Core', assignedAt: 'Jan 05, 2024', ttl: 'Permanent', initials: 'DA', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-302', name: 'Elena Kim', email: 'ekim@eng.io', workspace: 'Engineering Core', assignedAt: 'Jan 18, 2024', ttl: 'Permanent', initials: 'EK', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-303', name: 'Carlos Mendez', email: 'cmendez@eng.io', workspace: 'Engineering Core', assignedAt: 'Feb 02, 2024', ttl: 'Permanent', initials: 'CM', bg: 'bg-primary text-on-primary' },
      { id: 'usr-304', name: 'Zoe Patel', email: 'zpatel@eng.io', workspace: 'Engineering Core', assignedAt: 'Feb 20, 2024', ttl: 'Expires in 45 days', initials: 'ZP', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-305', name: 'Liam Murphy', email: 'lmurphy@eng.io', workspace: 'Research & Dev', assignedAt: 'Mar 01, 2024', ttl: 'Permanent', initials: 'LM', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-306', name: 'Hannah Scott', email: 'hscott@eng.io', workspace: 'Research & Dev', assignedAt: 'Mar 15, 2024', ttl: 'Permanent', initials: 'HS', bg: 'bg-primary text-on-primary' },
      { id: 'usr-307', name: 'Oliver Wang', email: 'owang@eng.io', workspace: 'Global Platform', assignedAt: 'Apr 02, 2024', ttl: 'Expires in 60 days', initials: 'OW', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-308', name: 'Sophia Martinez', email: 'smartinez@eng.io', workspace: 'Finance Secure', assignedAt: 'Apr 11, 2024', ttl: 'Permanent', initials: 'SM', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-309', name: 'Lucas Green', email: 'lgreen@eng.io', workspace: 'Engineering Core', assignedAt: 'May 04, 2024', ttl: 'Expires in 14d', initials: 'LG', bg: 'bg-primary text-on-primary' },
      { id: 'usr-310', name: 'Chloe Dubois', email: 'cdubois@eng.io', workspace: 'Engineering Core', assignedAt: 'May 19, 2024', ttl: 'Permanent', initials: 'CD', bg: 'bg-secondary-container text-on-secondary-container' },
    ],
  },
  {
    id: 'auditor',
    name: 'Read-Only Auditor',
    type: 'system',
    status: 'active',
    members: 5,
    perms: 6,
    icon: 'visibility',
    iconBg: 'bg-surface-container',
    desc: 'Strictly read-only access to workspaces, telemetry, compliance trails, and security audit logs for compliance officers.',
    scopeType: 'standard',
    scopeBadge: 'Scoped Namespace Access',
    subtitle: 'Compliance & audit view',
    avatars: [
      { text: 'RB', bg: 'bg-surface-container-highest text-on-surface' },
      { text: 'CL', bg: 'bg-secondary-container text-on-secondary-container' },
      { text: '+3', bg: 'bg-primary text-on-primary' },
    ],
    permPills: [
      { text: 'Audit Logs Read (3)' },
      { text: 'Workspace View (1)' },
      { text: 'Security Telemetry (2)' },
    ],
    permissionKeys: [
      'team.read', 'membership.read', 'role.read', 'permission.read', 'audit.read', 'access_request.read', 'access_grant.read', 'notification.read',
    ],
    assignedUsers: [
      { id: 'usr-401', name: 'Rachel Bell', email: 'rbell@compliance.net', workspace: 'Finance Secure', assignedAt: 'Feb 10, 2024', ttl: 'Permanent', initials: 'RB', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-402', name: 'Carl Lewis', email: 'clewis@audit.org', workspace: 'Engineering Core', assignedAt: 'Mar 01, 2024', ttl: 'Expires in 90d', initials: 'CL', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-403', name: 'Diana Prince', email: 'dprince@compliance.net', workspace: 'Global Platform', assignedAt: 'Mar 15, 2024', ttl: 'Permanent', initials: 'DP', bg: 'bg-primary text-on-primary' },
      { id: 'usr-404', name: 'Marcus Brody', email: 'mbrody@audit.org', workspace: 'Finance Secure', assignedAt: 'Apr 01, 2024', ttl: 'Expires in 30d', initials: 'MB', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-405', name: 'Evelyn Carter', email: 'ecarter@compliance.net', workspace: 'Engineering Core', assignedAt: 'May 10, 2024', ttl: 'Permanent', initials: 'EC', bg: 'bg-secondary-container text-on-secondary-container' },
    ],
  },
  {
    id: 'billing',
    name: 'Billing & Compliance Manager',
    type: 'custom',
    status: 'active',
    members: 4,
    perms: 7,
    icon: 'payments',
    iconBg: 'bg-secondary-container',
    desc: 'Custom finance role with elevated access to invoices, license seat provisioning, and vendor compliance exports.',
    scopeType: 'standard',
    scopeBadge: 'Scoped Namespace Access',
    subtitle: 'Finance & seat controls',
    avatars: [
      { text: 'FN', bg: 'bg-surface-container-highest text-on-surface' },
      { text: 'PT', bg: 'bg-secondary-container text-on-secondary-container' },
      { text: '+2', bg: 'bg-primary text-on-primary' },
    ],
    permPills: [
      { text: 'Billing & Invoices (4)' },
      { text: 'Seat Allocation (2)' },
      { text: 'Export Reports (1)' },
    ],
    permissionKeys: [
      'team.read', 'membership.read', 'membership.update', 'audit.read', 'notification.read', 'notification.update',
    ],
    assignedUsers: [
      { id: 'usr-501', name: 'Fiona Nelson', email: 'fiona.n@finance.corp', workspace: 'Finance Secure', assignedAt: 'Feb 12, 2024', ttl: 'Permanent', initials: 'FN', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-502', name: 'Peter Taylor', email: 'ptaylor@finance.corp', workspace: 'Finance Secure', assignedAt: 'Mar 05, 2024', ttl: 'Permanent', initials: 'PT', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-503', name: 'Amanda Clark', email: 'aclark@finance.corp', workspace: 'Marketing Global', assignedAt: 'Mar 20, 2024', ttl: 'Expires in 60d', initials: 'AC', bg: 'bg-primary text-on-primary' },
      { id: 'usr-504', name: 'Henry Wright', email: 'hwright@finance.corp', workspace: 'Engineering Core', assignedAt: 'Apr 02, 2024', ttl: 'Permanent', initials: 'HW', bg: 'bg-secondary-container text-on-secondary-container' },
    ],
  },
  {
    id: 'contractor',
    name: 'External Contractor Lead',
    type: 'custom',
    status: 'active',
    members: 4,
    perms: 6,
    icon: 'supervised_user_circle',
    iconBg: 'bg-surface-container',
    desc: 'Time-bound role tailored for external agency leads. Restricted from seeing internal billing and workspace member directories.',
    scopeType: 'standard',
    scopeBadge: 'Scoped Namespace Access',
    subtitle: 'Contractor agency scope',
    avatars: [
      { text: 'AG', bg: 'bg-secondary-container text-on-secondary-container' },
      { text: 'VX', bg: 'bg-surface-container-highest text-on-surface' },
      { text: '+2', bg: 'bg-primary text-on-primary' },
    ],
    permPills: [
      { text: 'Assigned Repos Only (2)' },
      { text: 'Task Management (3)' },
      { text: 'No PII Access (Guarded)', isWarning: true },
    ],
    permissionKeys: [
      'task.read', 'task.create', 'task.update', 'access_request.create', 'access_request.read', 'notification.read',
    ],
    assignedUsers: [
      { id: 'usr-601', name: 'Aaron Gomez', email: 'aaron@externalagency.com', workspace: 'Engineering Core', assignedAt: 'Jan 22, 2024', ttl: 'Expires in 14d', initials: 'AG', bg: 'bg-secondary-container text-on-secondary-container' },
      { id: 'usr-602', name: 'Valerie Xavier', email: 'valerie@externalagency.com', workspace: 'Engineering Core', assignedAt: 'Feb 05, 2024', ttl: 'Expires in 21d', initials: 'VX', bg: 'bg-surface-container-highest text-on-surface' },
      { id: 'usr-603', name: 'Brett Sterling', email: 'bsterling@contractors.io', workspace: 'Research & Dev', assignedAt: 'Mar 18, 2024', ttl: 'Expires in 30d', initials: 'BS', bg: 'bg-primary text-on-primary' },
      { id: 'usr-604', name: 'Monika Geller', email: 'mgeller@contractors.io', workspace: 'Marketing Global', assignedAt: 'Apr 09, 2024', ttl: 'Expires in 45d', initials: 'MG', bg: 'bg-secondary-container text-on-secondary-container' },
    ],
  },
  {
    id: 'legacy',
    name: 'Legacy API Sync Service',
    type: 'custom',
    status: 'archived',
    members: 0,
    perms: 3,
    icon: 'swap_calls',
    iconBg: 'bg-surface-container',
    desc: 'Deprecated role previously used for automated webhook integrations. Slated for decommissioning.',
    scopeType: 'standard',
    scopeBadge: 'Scoped Namespace Access',
    subtitle: 'Deprecated webhook role',
    isArchived: true,
    avatars: [],
    permPills: [
      { text: 'API Read (2)' },
      { text: 'Webhook Emit (1)' },
    ],
    permissionKeys: ['notification.read', 'task.read'],
    assignedUsers: [],
  },
];
