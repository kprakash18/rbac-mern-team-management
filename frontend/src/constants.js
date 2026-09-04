// ============================================================================
// APPLICATION UNIFIED CONSTANTS
// Single consolidated source of truth for all application constants
// ============================================================================

// ============================================================================
// SECTION: AUTH CONSTANTS
// ============================================================================

export const USE_MOCK_DATA = true;

export const MOCK_USERS = [
  {
    email: 'admin@platform.internal',
    password: 'password123',
    name: 'Alex Vance',
    role: 'Platform Super Admin',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  {
    email: 'superadmin@company.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'Platform Super Admin',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  // ── Team Admin Account ──
  {
    id: 'usr-dm',
    email: 'diana.m@acme.corp',
    password: 'password123',
    name: 'Diana Morales',
    role: 'Lead Architect',
    teamRoleTitle: 'Team Admin',
    isTeamAdmin: true,
    initials: 'DM',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  // ── Employee / Team Member Accounts (Workspace Portal) ──
  {
    id: 'usr-mv',
    email: 'marcus.v@acme.corp',
    password: 'password123',
    name: 'Marcus Vance',
    role: 'Developer',
    teamRoleTitle: 'Developer',
    isTeamAdmin: false,
    initials: 'MV',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  {
    email: 'alice.j@example.com',
    password: 'alice123',
    name: 'Alice Johnson',
    role: 'Lead Architect',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  {
    email: 'bkaur@engineering.corp',
    password: 'ben123',
    name: 'Ben Kaur',
    role: 'Senior Developer',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  // ── Edge Cases ──
  {
    email: 'invited@example.com',
    password: 'temp123Password!',
    name: 'Invited User',
    role: 'Team Member',
    accountStatus: 'INVITED',
    mustChangePassword: true,
  },
  {
    email: 'suspended@example.com',
    password: 'password123',
    name: 'Suspended User',
    role: 'Team Member',
    accountStatus: 'SUSPENDED',
    mustChangePassword: false,
  },
];

// ============================================================================
// SECTION: INVITATION CONSTANTS
// ============================================================================

export const INVITATION_STATES = {
  NEW_USER: 'NEW_USER',
  EXISTING_USER: 'EXISTING_USER',
  INVALID_TOKEN: 'INVALID_TOKEN',
};

export const MOCK_INVITATIONS = {
  newUser: {
    workspaceName: 'Acme Engineering',
    role: 'Developer',
    email: 'you@company.com',
  },
  existingUser: {
    workspaceName: 'Acme Corp',
    role: 'Editor',
    inviterName: 'Sarah Jenkins',
    inviterAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUhm-a08dX5iYhYuk7BxWrYgBpkxX_vqkM6FW476UPQO-E_KML5pYSD2-D1fqoEyZr_Ohktxb8dBqSwz-GQ6_icGd5CTRrqgnrNEENeio4axT7PZrvpKi98zdyRrII5jfboEozWIF0V-1fNzFvFhNzewLX0EJIEcrscgiyQsgfhs2iyVDXUnlJzLKmqRH8aRJ3JHwJYtorc1PnZqGsA5E_lfKkCuvIIXlpr6gvvKjibXyPT3cS3NLI2g',
  },
};

// ============================================================================
// SECTION: WORKSPACE CONSTANTS
// ============================================================================

export const MOCK_USER_WORKSPACES = [
  {
    id: 'team-eng-1',
    name: 'Acme Engineering',
    role: 'Developer',
    icon: 'engineering',
    iconBgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
  },
  {
    id: 'team-sales-2',
    name: 'Global Sales',
    role: 'Viewer',
    icon: 'public',
    iconBgColor: 'bg-secondary',
    iconTextColor: 'text-on-secondary',
  },
  {
    id: 'team-hr-3',
    name: 'HR & People',
    role: 'Admin',
    icon: 'groups',
    iconBgColor: 'bg-surface-tint',
    iconTextColor: 'text-on-primary',
  },
];

// ============================================================================
// SECTION: ROLES & PERMISSIONS CONSTANTS
// ============================================================================

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

// ============================================================================
// SECTION: SYSTEM BROADCASTS CONSTANTS
// ============================================================================

export const BROADCAST_TYPES = {
  OUTAGE: {
    id: 'OUTAGE',
    label: 'Critical Outage',
    icon: 'gpp_maybe',
    colorClass: 'text-error-text bg-error-bg border-error-container',
    badgeClass: 'bg-error-bg text-error-text border-error-container',
    bannerBg: 'bg-error text-on-error',
    bannerIcon: 'warning',
    defaultSeverity: 'P0 Critical Outage',
  },
  MAINTENANCE: {
    id: 'MAINTENANCE',
    label: 'Planned Maintenance',
    icon: 'build',
    colorClass: 'text-warning-text bg-warning-bg border-warning-bg',
    badgeClass: 'bg-warning-bg text-warning-text border-warning-bg',
    bannerBg: 'bg-amber-600 text-white',
    bannerIcon: 'schedule',
    defaultSeverity: 'Planned Maintenance',
  },
  POLICY: {
    id: 'POLICY',
    label: 'Policy & Compliance',
    icon: 'verified_user',
    colorClass: 'text-secondary-container text-on-secondary-container bg-secondary-container border-secondary-container',
    badgeClass: 'bg-secondary-container text-on-secondary-container border-secondary-container',
    bannerBg: 'bg-slate-900 text-white',
    bannerIcon: 'verified_user',
    defaultSeverity: 'Mandatory Policy Disclosure',
  },
  ANNOUNCEMENT: {
    id: 'ANNOUNCEMENT',
    label: 'Feature Announcement',
    icon: 'campaign',
    colorClass: 'text-success-text bg-success-bg border-success-bg',
    badgeClass: 'bg-success-bg text-success-text border-success-bg',
    bannerBg: 'bg-emerald-600 text-white',
    bannerIcon: 'campaign',
    defaultSeverity: 'Product Update',
  },
};

export const INITIAL_BROADCASTS = [
  {
    id: 'bc-1',
    title: 'US-East-1 Database Cluster Read-Replica Latency',
    message: 'Read query latency elevated on primary shard. Automated failover initiated. Non-dismissible sticky banner deployed across platform navigation.',
    type: 'OUTAGE',
    status: 'ACTIVE',
    severity: 'P0 Critical Outage',
    scope: 'GLOBAL',
    targetWorkspaces: ['All Workspaces (18 active)'],
    targetRoles: ['All Roles'],
    ackMode: 'READ_RECEIPT',
    cta: {
      label: 'Live Status Page →',
      url: 'https://status.platform.company.com/incidents/8492',
    },
    metrics: {
      targetedUsers: 1240,
      viewedCount: 1180,
      acknowledgedCount: 940,
    },
    workspaceBreakdown: [
      { workspace: 'Engineering Core', targeted: 858, viewed: 842, acknowledged: 790 },
      { workspace: 'Operations & SRE', targeted: 323, viewed: 312, acknowledged: 280 },
      { workspace: 'Finance & Billing Admins', targeted: 121, viewed: 110, acknowledged: 98 },
    ],
    roleBreakdown: [
      { role: 'Workspace Admin', targeted: 18, viewed: 18, acknowledged: 18 },
      { role: 'Team Member / Developer', targeted: 1100, viewed: 1040, acknowledged: 820 },
      { role: 'Read-Only Auditor', targeted: 122, viewed: 122, acknowledged: 102 },
    ],
    recentAcks: [
      { user: 'David Adams', email: 'dadams@engineering.corp', workspace: 'Engineering Core', timestamp: '2 mins ago', ip: '192.168.1.104' },
      { user: 'Alice Johnson', email: 'alice.j@example.com', workspace: 'Engineering Core', timestamp: '5 mins ago', ip: '192.168.1.88' },
      { user: 'Carlos Mendez', email: 'cmendez@finance.corp', workspace: 'Finance Secure', timestamp: '8 mins ago', ip: '10.0.4.12' },
      { user: 'Tina Liu', email: 'tina.l@marketing.corp', workspace: 'Marketing Global', timestamp: '11 mins ago', ip: '172.16.0.45' },
    ],
    startAt: '2026-09-03T10:30:00Z',
    endAt: '2026-09-03T14:30:00Z',
    createdAt: 'Today, 10:30 AM',
    createdBy: 'Alex Vance (Principal SRE)',
    timeLabel: 'Started 24m ago • Running until resolved',
    stickyNotice: 'Sticky mode: Non-dismissible until resolved',
  },
  {
    id: 'bc-2',
    title: 'Kafka Ingestion Pipeline v3.4 Migration',
    message: 'Scheduled maintenance window with live countdown banner. Minimal disruption expected to background streaming pipeline. Failover standby configured.',
    type: 'MAINTENANCE',
    status: 'SCHEDULED',
    severity: 'Planned Maintenance',
    scope: 'WORKSPACE_SCOPED',
    targetWorkspaces: ['Engineering Core', 'Platform SRE'],
    targetRoles: ['All Roles'],
    ackMode: 'READ_RECEIPT',
    cta: {
      label: 'View Migration Schedule',
      url: 'https://docs.platform.company.com/ops/maintenance-v34',
    },
    metrics: {
      targetedUsers: 480,
      viewedCount: 360,
      acknowledgedCount: 290,
    },
    workspaceBreakdown: [
      { workspace: 'Engineering Core', targeted: 320, viewed: 240, acknowledged: 190 },
      { workspace: 'Platform SRE', targeted: 160, viewed: 120, acknowledged: 100 },
    ],
    roleBreakdown: [
      { role: 'Workspace Admin', targeted: 12, viewed: 12, acknowledged: 10 },
      { role: 'DevOps Engineer', targeted: 85, viewed: 78, acknowledged: 65 },
    ],
    recentAcks: [
      { user: 'Robert Jones', email: 'r.jones@company.com', workspace: 'Platform SRE', timestamp: '25 mins ago', ip: '10.0.8.9' },
    ],
    startAt: '2026-10-28T02:00:00Z',
    endAt: '2026-10-28T04:00:00Z',
    createdAt: 'Sep 2, 02:00 PM',
    createdBy: 'Ops Bot (Automation)',
    timeLabel: 'Oct 28, 02:00 UTC — 04:00 UTC',
    countdown: 'T-4h 12m Countdown',
    stickyNotice: 'Notice will activate automatically 2 hours prior to start',
  },
  {
    id: 'bc-3',
    title: 'Q4 Mandatory SOC2 Access & Credential Rotation Policy',
    message: 'Mandatory quarterly disclosure requiring explicit electronic acknowledgment prior to proceeding with privileged console sessions.',
    type: 'POLICY',
    status: 'ACTIVE',
    severity: 'Policy & Compliance',
    scope: 'ROLE_SCOPED',
    targetWorkspaces: ['All Workspaces (18 active)'],
    targetRoles: ['Workspace Admins', 'Billing Managers'],
    ackMode: 'MANDATORY_ACK',
    cta: {
      label: 'Review Policy Documents',
      url: 'https://compliance.platform.company.com/soc2-q4',
    },
    metrics: {
      targetedUsers: 214,
      viewedCount: 198,
      acknowledgedCount: 184,
    },
    workspaceBreakdown: [
      { workspace: 'Finance Secure', targeted: 48, viewed: 48, acknowledged: 46 },
      { workspace: 'Engineering Core', targeted: 110, viewed: 102, acknowledged: 94 },
      { workspace: 'Operations', targeted: 56, viewed: 48, acknowledged: 44 },
    ],
    roleBreakdown: [
      { role: 'Workspace Admins', targeted: 140, viewed: 132, acknowledged: 122 },
      { role: 'Billing Managers', targeted: 74, viewed: 66, acknowledged: 62 },
    ],
    recentAcks: [
      { user: 'Carlos Mendez', email: 'cmendez@finance.corp', workspace: 'Finance Secure', timestamp: '14 mins ago', ip: '10.0.4.12' },
      { user: 'Elena Rostova', email: 'erostova@analytics.corp', workspace: 'Operations', timestamp: '42 mins ago', ip: '192.168.2.19' },
    ],
    startAt: '2026-10-20T00:00:00Z',
    endAt: '2026-10-31T23:59:59Z',
    createdAt: 'Oct 20, 09:00 AM',
    createdBy: 'Chief Compliance Officer',
    timeLabel: 'Active since Oct 20 • Expires in 4 days',
    pendingCount: 30,
    stickyNotice: '30 users pending mandatory signature',
  },
  {
    id: 'bc-4',
    title: 'Just-In-Time (JIT) Temporary Access Grants are now Live',
    message: 'Admins can now request and approve time-bounded role elevation directly from the JIT console with automated revocation and audit trails.',
    type: 'ANNOUNCEMENT',
    status: 'ACTIVE',
    severity: 'Feature Announcement',
    scope: 'GLOBAL',
    targetWorkspaces: ['All Workspaces (18 active)'],
    targetRoles: ['All Roles'],
    ackMode: 'NONE',
    cta: {
      label: 'Explore JIT Console →',
      url: '#jit-access',
    },
    metrics: {
      targetedUsers: 1240,
      viewedCount: 1080,
      acknowledgedCount: 840,
      clicks: 3420,
      ctr: '27.4%',
    },
    workspaceBreakdown: [
      { workspace: 'Engineering Core', targeted: 858, viewed: 780, acknowledged: 620 },
      { workspace: 'Operations & SRE', targeted: 323, viewed: 280, acknowledged: 200 },
    ],
    roleBreakdown: [
      { role: 'Workspace Admin', targeted: 18, viewed: 18, acknowledged: 18 },
    ],
    recentAcks: [],
    startAt: '2026-10-15T00:00:00Z',
    endAt: '2026-10-31T00:00:00Z',
    createdAt: 'Oct 15, 08:00 AM',
    createdBy: 'Product Operations Team',
    timeLabel: 'Oct 15 — Oct 31',
    stickyNotice: 'Dismissible by end-users after reading',
  },
  {
    id: 'bc-5',
    title: 'Legacy Redis Cache Cluster Deprecation',
    message: 'The v5.0 Redis in-memory cache endpoint has been deprecated and retired. All microservices have transitioned to the clustered multi-AZ cluster.',
    type: 'ANNOUNCEMENT',
    status: 'ENDED',
    severity: 'Platform Update',
    scope: 'WORKSPACE_SCOPED',
    targetWorkspaces: ['Engineering Core'],
    targetRoles: ['All Roles'],
    ackMode: 'READ_RECEIPT',
    cta: null,
    metrics: {
      targetedUsers: 858,
      viewedCount: 858,
      acknowledgedCount: 858,
    },
    workspaceBreakdown: [
      { workspace: 'Engineering Core', targeted: 858, viewed: 858, acknowledged: 858 },
    ],
    roleBreakdown: [],
    recentAcks: [],
    startAt: '2026-08-20T00:00:00Z',
    endAt: '2026-08-27T00:00:00Z',
    createdAt: 'Aug 20, 10:00 AM',
    createdBy: 'Site Reliability Engineering',
    timeLabel: 'Ended Aug 27',
    stickyNotice: 'Archived announcement',
  },
  {
    id: 'bc-6',
    title: 'Draft: Winter 2026 Data Residency & Regional Failover Protocols',
    message: 'Upcoming compliance update regarding EU and APAC tenant data isolation boundaries and cross-region disaster recovery drills.',
    type: 'POLICY',
    status: 'DRAFT',
    severity: 'Draft Policy',
    scope: 'GLOBAL',
    targetWorkspaces: ['All Workspaces (18 active)'],
    targetRoles: ['All Roles'],
    ackMode: 'MANDATORY_ACK',
    cta: null,
    metrics: {
      targetedUsers: 1240,
      viewedCount: 0,
      acknowledgedCount: 0,
    },
    workspaceBreakdown: [],
    roleBreakdown: [],
    recentAcks: [],
    startAt: null,
    endAt: null,
    createdAt: 'Yesterday, 04:15 PM',
    createdBy: 'Security Governance',
    timeLabel: 'Draft • Not yet published',
    stickyNotice: 'Pending compliance review before release',
  },
];

// ============================================================================
// SECTION: SUPER ADMIN PLATFORM CONSTANTS
// ============================================================================

export const SUPER_ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: 'dashboard' },
  { id: 'users-access', label: 'Users & Access', icon: 'group', path: 'users-access' },
  { id: 'roles-rbac', label: 'Roles & RBAC', icon: 'shield_person', path: 'roles-rbac' },
  { id: 'jit-access', label: 'JIT Access Grants', icon: 'timer', path: 'jit-access' },
  { id: 'system-broadcasts', label: 'System Broadcasts', icon: 'campaign', path: 'system-broadcasts' },
  { id: 'security-audit', label: 'Security Audit Logs', icon: 'policy', path: 'security-audit' },
];

export const MOCK_PLATFORM_METRICS = {
  workspaces: { total: 14, active: 12, archived: 2 },
  users: { total: 148, active: 142, invited: 4, suspended: 2 },
  jitGrants: { active: 5, trending: '+2', percentage: '35%' },
  securityEvents: { today: 28, last24Hours: 'Last 24 hours' },
};

export const MOCK_RECENT_ACTIVITIES = [
  { id: 'act-1', time: '10:42 AM', actor: { name: 'John Doe', initials: 'JD' }, action: 'Role Assignment', target: 'usr_a9f8b7c', result: 'Success', resultType: 'success' },
  { id: 'act-2', time: '09:15 AM', actor: { name: 'System Auto', isSystem: true, icon: 'smart_toy' }, action: 'JIT Grant Expired', target: 'role_db_admin', result: 'System', resultType: 'system' },
  { id: 'act-3', time: '08:30 AM', actor: { name: 'Alice Smith', initials: 'AS' }, action: 'Workspace Created', target: 'ws_marketing_24', result: 'Success', resultType: 'success' },
  { id: 'act-4', time: 'Yesterday, 18:22', actor: { name: 'Unknown IP', initials: 'UK', isError: true }, action: 'Failed Login Auth', target: '192.168.1.44', result: 'Failed', resultType: 'failed' },
  { id: 'act-5', time: 'Yesterday, 14:05', actor: { name: 'John Doe', initials: 'JD' }, action: 'JIT Request', target: 'prod_db_access', result: 'Pending', resultType: 'pending' },
];

export const MOCK_ACTIVE_WORKSPACES = [
  { id: 'ws-1', name: 'Engineering Core', membersCount: 42, status: 'Active', icon: 'engineering' },
  { id: 'ws-2', name: 'Marketing Global', membersCount: 18, status: 'Active', icon: 'campaign' },
  { id: 'ws-3', name: 'Finance Secure', membersCount: 8, status: 'High Security', icon: 'payments' },
  { id: 'ws-4', name: 'Customer Support EU', membersCount: 24, status: 'Active', icon: 'support_agent' },
];

export const WORKSPACE_ROLES_MAP = {
  'Research & Development': ['Lead Researcher', 'Data Scientist', 'ML Engineer', 'Developer', 'Viewer'],
  'Engineering Core': ['Lead Architect', 'Senior Engineer', 'DevOps Engineer', 'QA Tester', 'Viewer'],
  'Marketing Global': ['Campaign Manager', 'Content Creator', 'SEO Specialist', 'Editor', 'Viewer'],
  'Finance Secure': ['Finance Controller', 'Auditor', 'Compliance Officer', 'Billing Admin', 'Viewer'],
  'Customer Support EU': ['Support Lead', 'Tier 2 Agent', 'Tier 1 Specialist', 'Viewer'],
  'Production': ['Release Manager', 'Site Reliability Engineer', 'Production Admin', 'Operator', 'Viewer'],
  'Staging': ['QA Engineer', 'Tester', 'Developer', 'Admin', 'Viewer'],
};

export const DEFAULT_WORKSPACE = 'Research & Development';

// ============================================================================
// SECTION: AUDIT LOG CONSTANTS
// ============================================================================

export const AUDIT_SEVERITY = {
  CRITICAL: {
    id: 'CRITICAL',
    label: 'Critical',
    badgeClass: 'bg-error-bg text-error-text border-error-container',
    dotClass: 'bg-error-text',
    icon: 'gpp_maybe',
  },
  WARNING: {
    id: 'WARNING',
    label: 'Warning',
    badgeClass: 'bg-warning-bg text-warning-text border-warning-bg',
    dotClass: 'bg-warning-text',
    icon: 'warning',
  },
  INFO: {
    id: 'INFO',
    label: 'Info',
    badgeClass: 'bg-surface-variant text-on-surface-variant border-outline',
    dotClass: 'bg-outline',
    icon: 'info',
  },
};

export const AUDIT_CATEGORIES = {
  ALL: 'All Categories',
  AUTH: 'Authentication & Access',
  JIT: 'Privilege & JIT Grants',
  RBAC: 'Roles & RBAC',
  WORKSPACE: 'Workspaces & Fleet',
  BROADCAST: 'System Broadcasts',
};

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-1092',
    timestamp: 'Just now • 12:24:10 PM',
    isoDate: '2026-09-03T12:24:10Z',
    actor: {
      id: 'usr_admin_1',
      name: 'Super Admin',
      email: 'admin@platform.internal',
      role: 'Platform Super Admin',
      initials: 'SA',
      bgClass: 'bg-primary text-on-primary',
    },
    action: 'JIT_GRANT_REVOKED',
    actionLabel: 'JIT Grant Revoked',
    category: 'JIT',
    severity: 'WARNING',
    targetType: 'AccessGrant',
    targetIdentifier: 'grant_db_admin_94',
    workspace: 'Engineering Core',
    result: 'SUCCESS',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    metadata: {
      grantId: 'grant_db_admin_94',
      targetUser: 'Sarah Connor (s.connor@cyber.corp)',
      elevatedRole: 'DB_ADMIN',
      targetResource: 'prod-db-cluster-1',
      revocationReason: 'Task completed ahead of scheduled TTL window',
      remainingDurationSec: 1420,
    },
  },
  {
    id: 'aud-1091',
    timestamp: '4 mins ago • 12:20:05 PM',
    isoDate: '2026-09-03T12:20:05Z',
    actor: {
      id: 'usr_unknown',
      name: 'Unknown Actor',
      email: 'unknown@external.net',
      role: 'Unauthenticated',
      initials: 'UK',
      bgClass: 'bg-error-bg text-error-text',
    },
    action: 'AUTH_FAILURE_BRUTE_FORCE',
    actionLabel: 'Failed Login (Brute Force Alert)',
    category: 'AUTH',
    severity: 'CRITICAL',
    targetType: 'UserAccount',
    targetIdentifier: 'admin@platform.internal',
    workspace: 'Global System',
    result: 'FAILURE',
    ipAddress: '45.33.32.156',
    userAgent: 'Python-urllib/3.9 (Automated Scraper Bot)',
    metadata: {
      attemptedEmail: 'admin@platform.internal',
      failureReason: 'INVALID_CREDENTIALS_AND_MFA_MISSING',
      consecutiveFailures: 5,
      geoCity: 'Frankfurt',
      geoCountry: 'DE',
      rateLimitAction: 'IP_TEMPORARILY_THROTTLED_15M',
    },
  },
  {
    id: 'aud-1090',
    timestamp: '18 mins ago • 12:06:12 PM',
    isoDate: '2026-09-03T12:06:12Z',
    actor: {
      id: 'usr_admin_1',
      name: 'Super Admin',
      email: 'admin@platform.internal',
      role: 'Platform Super Admin',
      initials: 'SA',
      bgClass: 'bg-primary text-on-primary',
    },
    action: 'SYSTEM_BROADCAST_PUBLISHED',
    actionLabel: 'System Broadcast Published',
    category: 'BROADCAST',
    severity: 'WARNING',
    targetType: 'Broadcast',
    targetIdentifier: 'bc-1',
    workspace: 'Global Fleet (18 workspaces)',
    result: 'SUCCESS',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    metadata: {
      broadcastId: 'bc-1',
      title: 'US-East-1 Database Cluster Read-Replica Latency',
      severity: 'P0 Critical Outage',
      scope: 'GLOBAL',
      targetedUsersCount: 1240,
    },
  },
  {
    id: 'aud-1089',
    timestamp: '42 mins ago • 11:42:30 AM',
    isoDate: '2026-09-03T11:42:30Z',
    actor: {
      id: 'usr_carlos_m',
      name: 'Carlos Mendez',
      email: 'cmendez@finance.corp',
      role: 'Workspace Admin',
      initials: 'CM',
      bgClass: 'bg-secondary-container text-on-secondary-container',
    },
    action: 'ROLE_MODIFIED',
    actionLabel: 'Role Permissions Modified',
    category: 'RBAC',
    severity: 'WARNING',
    targetType: 'Role',
    targetIdentifier: 'role_finance_controller',
    workspace: 'Finance Secure',
    result: 'SUCCESS',
    ipAddress: '10.0.4.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/127.0.0.0',
    metadata: {
      roleName: 'Finance Controller',
      addedPermissions: ['billing.export', 'pci.compliance_view'],
      removedPermissions: ['role.delete'],
      changeReason: 'Q3 audit policy alignment',
    },
  },
  {
    id: 'aud-1088',
    timestamp: '1 hour ago • 11:20:15 AM',
    isoDate: '2026-09-03T11:20:15Z',
    actor: {
      id: 'usr_elena_r',
      name: 'Elena Rostova',
      email: 'erostova@analytics.corp',
      role: 'Team Member',
      initials: 'ER',
      bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
    },
    action: 'JIT_ACCESS_REQUESTED',
    actionLabel: 'JIT Privilege Elevation Requested',
    category: 'JIT',
    severity: 'INFO',
    targetType: 'AccessRequest',
    targetIdentifier: 'req_k8s_write_88',
    workspace: 'Operations',
    result: 'SUCCESS',
    ipAddress: '192.168.2.19',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    metadata: {
      requestedRole: 'K8S_WRITE',
      requestedDuration: '2h',
      ticketId: 'OPS-3920',
      businessJustification: 'Hotfix patch deployment for ingestion runner memory leak',
    },
  },
  {
    id: 'aud-1087',
    timestamp: '2 hours ago • 10:15:00 AM',
    isoDate: '2026-09-03T10:15:00Z',
    actor: {
      id: 'usr_admin_1',
      name: 'Super Admin',
      email: 'admin@platform.internal',
      role: 'Platform Super Admin',
      initials: 'SA',
      bgClass: 'bg-primary text-on-primary',
    },
    action: 'WORKSPACE_CREATED',
    actionLabel: 'Workspace Provisioned',
    category: 'WORKSPACE',
    severity: 'INFO',
    targetType: 'Team',
    targetIdentifier: 'team_rd_labs_24',
    workspace: 'Research & Development',
    result: 'SUCCESS',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    metadata: {
      workspaceName: 'Research & Development Labs',
      assignedLead: 'Dr. Aris Thorne (athorne@rd.corp)',
      tier: 'High Security (Isolated Sandbox)',
      initialQuotaSeats: 25,
    },
  },
  {
    id: 'aud-1086',
    timestamp: '3 hours ago • 09:12:44 AM',
    isoDate: '2026-09-03T09:12:44Z',
    actor: {
      id: 'usr_alice_j',
      name: 'Alice Johnson',
      email: 'alice.j@example.com',
      role: 'Lead Architect',
      initials: 'AJ',
      bgClass: 'bg-secondary text-on-secondary',
    },
    action: 'AUTH_SUCCESS_MFA',
    actionLabel: 'MFA Authentication Verified',
    category: 'AUTH',
    severity: 'INFO',
    targetType: 'Session',
    targetIdentifier: 'sess_99a8b7',
    workspace: 'Engineering Core',
    result: 'SUCCESS',
    ipAddress: '192.168.1.88',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    metadata: {
      authMethod: 'TOTP_HARDWARE_KEY',
      sessionDurationHours: 8,
    },
  },
  {
    id: 'aud-1085',
    timestamp: 'Yesterday • 06:45:10 PM',
    isoDate: '2026-09-02T18:45:10Z',
    actor: {
      id: 'usr_carlos_m',
      name: 'Carlos Mendez',
      email: 'cmendez@finance.corp',
      role: 'Workspace Admin',
      initials: 'CM',
      bgClass: 'bg-secondary-container text-on-secondary-container',
    },
    action: 'MEMBER_INVITED',
    actionLabel: 'New Member Invited',
    category: 'WORKSPACE',
    severity: 'INFO',
    targetType: 'Invitation',
    targetIdentifier: 'inv_8492c',
    workspace: 'Finance Secure',
    result: 'SUCCESS',
    ipAddress: '10.0.4.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    metadata: {
      inviteeEmail: 'r.jones@finance.corp',
      assignedRole: 'Auditor',
      expiryDate: '2026-09-09T18:45:00Z',
    },
  },
];

// ============================================================================
// SECTION: JIT ACCESS CONSTANTS
// ============================================================================

export const INITIAL_ACTIVE_GRANTS = [
  {
    id: 'grant-1',
    user: {
      name: 'John Doe',
      email: 'j.doe@company.com',
      initials: 'JD',
      bgClass: 'bg-primary-container text-on-primary-container',
    },
    workspace: 'Engineering',
    permission: 'DB_ADMIN',
    permBadgeClass: 'bg-warning-bg text-warning-text border-warning-bg',
    targetResource: 'prod-db-cluster-1',
    grantedBy: 'System Auto',
    totalSeconds: 1245,
    remainingSeconds: 1245,
  },
  {
    id: 'grant-2',
    user: {
      name: 'Alice Smith',
      email: 'a.smith@company.com',
      initials: 'AS',
      bgClass: 'bg-secondary-container text-on-secondary-container',
    },
    workspace: 'Operations',
    permission: 'K8S_WRITE',
    permBadgeClass: 'bg-primary-container text-on-primary-container border-primary-container',
    targetResource: 'eks-us-east-2',
    grantedBy: 'M. Johnson',
    totalSeconds: 7530,
    remainingSeconds: 7530,
  },
  {
    id: 'grant-3',
    user: {
      name: 'Robert Jones',
      email: 'r.jones@company.com',
      initials: 'RJ',
      bgClass: 'bg-tertiary-container text-on-tertiary-container',
    },
    workspace: 'Security',
    permission: 'AUDIT_LOG_READ',
    permBadgeClass: 'bg-surface-variant text-on-surface-variant border-surface-variant',
    targetResource: 'global-audit-trail',
    grantedBy: 'S. Lee',
    totalSeconds: 21600,
    remainingSeconds: 21600,
  },
];

export const INITIAL_PENDING_REQUESTS = [
  {
    id: 'req-101',
    user: {
      name: 'David Adams',
      email: 'dadams@engineering.corp',
      initials: 'DA',
      bgClass: 'bg-secondary-container text-on-secondary-container',
      role: 'Senior Backend Engineer',
    },
    workspace: 'Engineering Core',
    permission: 'PROD_DEPLOY',
    permBadgeClass: 'bg-warning-bg text-warning-text border-warning-bg',
    targetResource: 'k8s-prod-cluster-east',
    requestedDuration: '1 Hour',
    ticketId: 'INC-8492',
    riskLevel: 'HIGH',
    reason: 'Hotfix deployment for billing latency incident INC-8492. Primary database connection pool reaching saturation during peak payroll hours. Need immediate elevation to roll out patched query index.',
    submittedAt: '12 mins ago',
    scopeBoundary: 'Production Cluster Namespace (us-east-2)',
  },
  {
    id: 'req-102',
    user: {
      name: 'Tina Liu',
      email: 'tina.l@marketing.corp',
      initials: 'TL',
      bgClass: 'bg-primary-container text-on-primary-container',
      role: 'Growth Marketing Lead',
    },
    workspace: 'Marketing Global',
    permission: 'USER_INVITE_BATCH',
    permBadgeClass: 'bg-surface-variant text-on-surface-variant border-surface-variant',
    targetResource: 'workspace-invitations',
    requestedDuration: '4 Hours',
    ticketId: 'OPS-3920',
    riskLevel: 'MEDIUM',
    reason: 'Onboarding 6 external agency marketing leads for Q3 global product launch campaign. Need batch invite privilege to assign read-scoped workspace tokens before Monday rollout.',
    submittedAt: '35 mins ago',
    scopeBoundary: 'Marketing Workspace Domain',
  },
  {
    id: 'req-103',
    user: {
      name: 'Carlos Mendez',
      email: 'cmendez@finance.corp',
      initials: 'CM',
      bgClass: 'bg-tertiary-container text-on-tertiary-container',
      role: 'Staff Compliance Auditor',
    },
    workspace: 'Finance Secure',
    permission: 'AUDIT_LEDGER_READ',
    permBadgeClass: 'bg-surface-variant text-on-surface-variant border-surface-variant',
    targetResource: 'financial-ledger-2024',
    requestedDuration: '2 Hours',
    ticketId: 'AUD-7714',
    riskLevel: 'LOW',
    reason: 'Quarterly compliance audit verification for external KPMG review. Requires read-only export privileges for general ledger transaction logs spanning Q1-Q2.',
    submittedAt: '1 hour ago',
    scopeBoundary: 'Encrypted Financial Vault',
  },
];

export const INITIAL_JIT_HISTORY = [
  {
    id: 'hist-1',
    user: {
      name: 'Sarah Connor',
      email: 'sconnor@security.corp',
      initials: 'SC',
      bgClass: 'bg-primary-container text-on-primary-container',
    },
    workspace: 'Security',
    permission: 'SECRETS_ROTATE',
    permBadgeClass: 'bg-error-bg text-error-text border-error-container',
    targetResource: 'vault-master-cluster',
    grantedBy: 'M. Johnson',
    outcome: 'EXPIRED',
    outcomeClass: 'bg-surface-variant text-on-surface-variant border-surface-variant',
    duration: '2 Hours',
    endedAt: 'Today at 09:14 AM',
    reason: 'Emergency rotation of compromised staging API tokens.',
  },
  {
    id: 'hist-2',
    user: {
      name: 'Liam Vance',
      email: 'lvance@engineering.corp',
      initials: 'LV',
      bgClass: 'bg-secondary-container text-on-secondary-container',
    },
    workspace: 'Engineering',
    permission: 'DB_ADMIN',
    permBadgeClass: 'bg-warning-bg text-warning-text border-warning-bg',
    targetResource: 'staging-aurora-db',
    grantedBy: 'Super Admin',
    outcome: 'REVOKED',
    outcomeClass: 'bg-error-bg text-error-text border-error-container',
    duration: '45 Mins',
    endedAt: 'Yesterday at 04:30 PM',
    reason: 'Prematurely revoked after schema migration completed successfully.',
  },
  {
    id: 'hist-3',
    user: {
      name: 'Elena Rostova',
      email: 'erostova@analytics.corp',
      initials: 'ER',
      bgClass: 'bg-tertiary-container text-on-tertiary-container',
    },
    workspace: 'Operations',
    permission: 'INFRA_DELETE',
    permBadgeClass: 'bg-error-bg text-error-text border-error-container',
    targetResource: 'legacy-vpc-eu-west',
    grantedBy: 'Security Lead',
    outcome: 'REJECTED',
    outcomeClass: 'bg-warning-bg text-warning-text border-warning-bg',
    duration: '0 Mins',
    endedAt: '2 days ago',
    reason: 'Rejected: Infrastructure decommissioning requires change approval board sign-off.',
  },
];

// ============================================================================
// SECTION: WORKSPACE APP CONSTANTS
// ============================================================================

// ─────────────────────────────────────────────
// Workspace User Personas (Role Simulation)
// ─────────────────────────────────────────────
export const WORKSPACE_PERSONAS = [
  {
    id: 'usr-dm',
    name: 'Diana Morales',
    email: 'diana.m@acme.corp',
    initials: 'DM',
    role: 'Lead Architect',
    teamRoleTitle: 'Team Admin',
    isTeamAdmin: true,
    canDeleteTasks: true,
    canInviteMembers: true,
    canApproveJit: true,
    channel: '#core-platform',
  },
  {
    id: 'usr-mv',
    name: 'Marcus Vance',
    email: 'marcus.v@acme.corp',
    initials: 'MV',
    role: 'Senior Backend Developer',
    teamRoleTitle: 'Developer',
    isTeamAdmin: false,
    canDeleteTasks: false,
    canInviteMembers: false,
    canApproveJit: false,
    channel: '#api-gateway',
  },
  {
    id: 'usr-view',
    name: 'Alex Rivera',
    email: 'alex.r@acme.corp',
    initials: 'AR',
    role: 'Product Observer',
    teamRoleTitle: 'Viewer',
    isTeamAdmin: false,
    canDeleteTasks: false,
    canInviteMembers: false,
    canApproveJit: false,
    channel: '#general',
  },
];

export const MOCK_CURRENT_USER = WORKSPACE_PERSONAS[0];

// ─────────────────────────────────────────────
// Current Active Workspace
// ─────────────────────────────────────────────
export const MOCK_CURRENT_WORKSPACE = {
  id: 'team-eng-1',
  name: 'Engineering Core',
  description: 'Primary engineering workspace for platform infrastructure and product development.',
  icon: 'engineering',
  membersCount: 42,
  status: 'ACTIVE',
  tier: 'Standard',
};

// ─────────────────────────────────────────────
// Workspace Team Members Directory (Canonical)
// ─────────────────────────────────────────────
export const WORKSPACE_TEAM_MEMBERS = [
  {
    id: 'usr-dm',
    name: 'Diana Morales',
    initials: 'DM',
    email: 'diana.m@acme.corp',
    role: 'Lead Architect',
    teamRole: 'Team Admin',
    department: 'Platform Architecture',
    status: 'Active',
    joinedDate: 'Jan 2024',
    permissions: ['Team Administration', 'Task Full Access', 'JIT Access Approval', 'Audit Log Access'],
  },
  {
    id: 'usr-cd',
    name: 'Charlie Davis',
    initials: 'CD',
    email: 'charlie.d@acme.corp',
    role: 'Senior Staff SRE',
    teamRole: 'Project Manager',
    department: 'Reliability & Database Systems',
    status: 'Active',
    joinedDate: 'Mar 2024',
    permissions: ['Task Management', 'Deployment Approvals', 'Access Request', 'System Monitoring'],
  },
  {
    id: 'usr-aj',
    name: 'Alice Johnson',
    initials: 'AJ',
    email: 'alice.j@acme.corp',
    role: 'DevOps Engineer',
    teamRole: 'Developer',
    department: 'Cloud Infrastructure',
    status: 'Active',
    joinedDate: 'Apr 2024',
    permissions: ['Task Create & Update', 'CI/CD Pipelines', 'Access Request'],
  },
  {
    id: 'usr-er',
    name: 'Elena Rostova',
    initials: 'ER',
    email: 'elena.r@acme.corp',
    role: 'Security Auditor',
    teamRole: 'Security Auditor',
    department: 'Governance & Compliance',
    status: 'On-Call',
    joinedDate: 'Feb 2024',
    permissions: ['Audit Log Read', 'Security Policy Inspection', 'Access Request'],
  },
  {
    id: 'usr-mv',
    name: 'Marcus Vance',
    initials: 'MV',
    email: 'marcus.v@acme.corp',
    role: 'Senior Backend Developer',
    teamRole: 'Developer',
    department: 'API & Gateway Services',
    status: 'Active',
    joinedDate: 'May 2024',
    permissions: ['Task Create & Update', 'API Deployment', 'Access Request'],
  },
  {
    id: 'usr-sl',
    name: 'Sophia Lin',
    initials: 'SL',
    email: 'sophia.l@acme.corp',
    role: 'Lead UI Engineer',
    teamRole: 'Developer',
    department: 'Design System & Frontend',
    status: 'Active',
    joinedDate: 'Jun 2024',
    permissions: ['Task Create & Update', 'Frontend Release', 'Access Request'],
  },
];

// ─────────────────────────────────────────────
// Legacy Team Members Directory
// ─────────────────────────────────────────────
export const MOCK_TEAM_MEMBERS = [
  {
    id: 'usr_alice_j',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    initials: 'AJ',
    role: 'Lead Architect',
    status: 'ACTIVE',
    lastActive: 'Online now',
    bgClass: 'bg-primary text-on-primary',
    isCurrentUser: true,
  },
  {
    id: 'usr_ben_k',
    name: 'Ben Kaur',
    email: 'bkaur@engineering.corp',
    initials: 'BK',
    role: 'Senior Developer',
    status: 'ACTIVE',
    lastActive: '12 mins ago',
    bgClass: 'bg-secondary text-on-secondary',
  },
  {
    id: 'usr_diana_m',
    name: 'Diana Morales',
    email: 'd.morales@engineering.corp',
    initials: 'DM',
    role: 'DevOps Engineer',
    status: 'ACTIVE',
    lastActive: '1 hour ago',
    bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
  },
  {
    id: 'usr_carlos_t',
    name: 'Carlos Torres',
    email: 'c.torres@engineering.corp',
    initials: 'CT',
    role: 'Developer',
    status: 'ACTIVE',
    lastActive: '3 hours ago',
    bgClass: 'bg-secondary-container text-on-secondary-container',
  },
  {
    id: 'usr_priya_s',
    name: 'Priya Sharma',
    email: 'p.sharma@engineering.corp',
    initials: 'PS',
    role: 'Developer',
    status: 'ACTIVE',
    lastActive: 'Yesterday',
    bgClass: 'bg-primary-fixed text-on-primary-fixed',
  },
  {
    id: 'usr_leo_r',
    name: 'Leo Ramos',
    email: 'l.ramos@engineering.corp',
    initials: 'LR',
    role: 'Auditor',
    status: 'ACTIVE',
    lastActive: 'Yesterday',
    bgClass: 'bg-surface-tint text-on-primary',
  },
  {
    id: 'usr_nina_w',
    name: 'Nina Weber',
    email: 'n.weber@engineering.corp',
    initials: 'NW',
    role: 'Developer',
    status: 'INVITED',
    lastActive: 'Pending invitation',
    bgClass: 'bg-surface-container-high text-outline',
  },
];

// ─────────────────────────────────────────────
// My Role Permissions (Lead Architect)
// ─────────────────────────────────────────────
export const MY_PERMISSIONS = {
  roleName: 'Lead Architect',
  roleDescription: 'Full technical ownership with elevated infrastructure and security access.',
  categories: [
    {
      name: 'Team Management',
      icon: 'groups',
      permissions: [
        { key: 'team.view', label: 'View Team', granted: true },
        { key: 'team.invite', label: 'Invite Members', granted: true },
        { key: 'team.remove_member', label: 'Remove Members', granted: true },
        { key: 'team.settings', label: 'Edit Team Settings', granted: false },
        { key: 'team.delete', label: 'Delete Workspace', granted: false },
      ],
    },
    {
      name: 'Task & Project Management',
      icon: 'task_alt',
      permissions: [
        { key: 'task.create', label: 'Create Tasks', granted: true },
        { key: 'task.edit', label: 'Edit Any Task', granted: true },
        { key: 'task.delete', label: 'Delete Tasks', granted: true },
        { key: 'task.assign', label: 'Assign Tasks to Members', granted: true },
      ],
    },
    {
      name: 'Role & Access Control',
      icon: 'shield_person',
      permissions: [
        { key: 'role.view', label: 'View Roles', granted: true },
        { key: 'role.assign', label: 'Assign Roles', granted: false },
        { key: 'role.create', label: 'Create Custom Roles', granted: false },
        { key: 'role.delete', label: 'Delete Roles', granted: false },
      ],
    },
    {
      name: 'Infrastructure & Security',
      icon: 'security',
      permissions: [
        { key: 'infra.view_logs', label: 'View Audit Logs', granted: true },
        { key: 'infra.deploy', label: 'Trigger Deployments', granted: true },
        { key: 'infra.manage_secrets', label: 'Manage Secrets', granted: false },
        { key: 'infra.pci_view', label: 'PCI Compliance View', granted: false },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// Team JIT Access Requests (Hierarchical Governance)
// ─────────────────────────────────────────────
export const TEAM_JIT_REQUESTS = [
  {
    id: 'req_dm_991',
    memberId: 'usr-dm',
    memberName: 'Diana Morales',
    memberRole: 'Lead Architect',
    isTeamAdmin: true,
    memberInitials: 'DM',
    requestedRole: 'INFRA_DEPLOY',
    requestedRoleLabel: 'DevSecOps Admin (Cluster Root)',
    justification: 'Emergency IAM cross-account trust policy synchronization in US-East-1',
    ticketId: 'SEC-9912',
    requestedDuration: '2h',
    status: 'PENDING',
    statusLabel: 'Pending Super Admin Review',
    approvalLevel: 'SUPER_ADMIN',
    createdAt: '10m ago',
    risk: 'Critical',
  },
  {
    id: 'req_k8s_942',
    memberId: 'usr-cd',
    memberName: 'Charlie Davis',
    memberRole: 'Senior Staff SRE',
    isTeamAdmin: false,
    memberInitials: 'CD',
    requestedRole: 'K8S_WRITE',
    requestedRoleLabel: 'Kubernetes Cluster Admin',
    justification: 'Execute database replica pod failover and scale statefulset (#INC-8492)',
    ticketId: 'INC-8492',
    requestedDuration: '2h',
    status: 'PENDING',
    statusLabel: 'Pending Team Admin Review',
    approvalLevel: 'TEAM_ADMIN',
    createdAt: '25m ago',
    risk: 'High',
  },
  {
    id: 'req_sec_311',
    memberId: 'usr-er',
    memberName: 'Elena Rostova',
    memberRole: 'Security Auditor',
    isTeamAdmin: false,
    memberInitials: 'ER',
    requestedRole: 'SECRETS_READ',
    requestedRoleLabel: 'Secrets Manager Read',
    justification: 'Validate HashiCorp Vault transit engine rotation evidence for Q3 SOC2 audit',
    ticketId: 'SEC-311',
    requestedDuration: '4h',
    status: 'PENDING',
    statusLabel: 'Pending Team Admin Review',
    approvalLevel: 'TEAM_ADMIN',
    createdAt: '45m ago',
    risk: 'Medium',
  },
  {
    id: 'req_prod_admin_88',
    memberId: 'usr-mv',
    memberName: 'Marcus Vance',
    memberRole: 'Senior Backend Developer',
    isTeamAdmin: false,
    memberInitials: 'MV',
    requestedRole: 'DB_READ_ONLY',
    requestedRoleLabel: 'Database Read-Only',
    justification: 'Investigating slow query performance on user directory replica',
    ticketId: 'ENG-8842',
    requestedDuration: '1h',
    status: 'APPROVED',
    statusLabel: 'Active Lease',
    approvalLevel: 'TEAM_ADMIN',
    approvedBy: 'Diana Morales (Team Admin)',
    expiresAt: '42m remaining',
    createdAt: '18m ago',
    risk: 'Low',
  },
  {
    id: 'req_ci_admin_60',
    memberId: 'usr-aj',
    memberName: 'Alice Johnson',
    memberRole: 'DevOps Engineer',
    isTeamAdmin: false,
    memberInitials: 'AJ',
    requestedRole: 'CI_ADMIN',
    requestedRoleLabel: 'CI/CD Pipeline Admin',
    justification: 'Reconfigure GitHub Actions runner environment transit secrets',
    ticketId: 'DEVOPS-441',
    requestedDuration: '30m',
    status: 'REJECTED',
    statusLabel: 'Rejected',
    approvalLevel: 'TEAM_ADMIN',
    rejectionReason: 'Secrets rotation requires security auditor presence.',
    approvedBy: 'Diana Morales (Team Admin)',
    expiresAt: null,
    createdAt: '2 days ago',
    risk: 'High',
  },
];

export const MY_JIT_HISTORY = TEAM_JIT_REQUESTS;

// ─────────────────────────────────────────────
// Available Roles for JIT Request
// ─────────────────────────────────────────────
export const AVAILABLE_JIT_ROLES = [
  { id: 'DB_READ_ONLY', label: 'Database Read-Only', icon: 'storage', risk: 'Low' },
  { id: 'DB_ADMIN', label: 'Database Admin (Full)', icon: 'database', risk: 'Critical' },
  { id: 'K8S_READ', label: 'Kubernetes Read', icon: 'cloud', risk: 'Low' },
  { id: 'K8S_WRITE', label: 'Kubernetes Write', icon: 'cloud_upload', risk: 'High' },
  { id: 'CI_ADMIN', label: 'CI/CD Pipeline Admin', icon: 'build', risk: 'High' },
  { id: 'SECRETS_READ', label: 'Secrets Manager Read', icon: 'lock', risk: 'Medium' },
  { id: 'INFRA_DEPLOY', label: 'Infrastructure Deploy', icon: 'rocket_launch', risk: 'Critical' },
];

// ─────────────────────────────────────────────
// Workspace Announcements / Broadcasts
// ─────────────────────────────────────────────
export const MOCK_ANNOUNCEMENTS = [
  {
    id: 'bc-1',
    title: 'US-East-1 Database Cluster Read-Replica Latency',
    body: 'We are currently experiencing elevated read latency on the US-East-1 database read-replica cluster. Our infrastructure team is actively investigating. All writes are unaffected. ETA for resolution: 45 minutes. Avoid non-critical reports generation during this window.',
    type: 'OUTAGE',
    typeLabel: 'P0 Critical Outage',
    severity: 'CRITICAL',
    isActive: true,
    isSticky: true,
    requiresAck: false,
    sentAt: '2026-09-03T12:06:12Z',
    sentBy: 'Super Admin',
    isRead: false,
    isAcknowledged: false,
  },
  {
    id: 'bc-2',
    title: 'Planned Maintenance: API Gateway Restart (Sept 5, 2026)',
    body: 'We will be performing a scheduled maintenance restart of the API Gateway on September 5th, 2026 between 02:00 AM - 03:00 AM UTC. Expect brief service interruptions for 5-10 minutes. No action required from your team. Please plan your deployments accordingly.',
    type: 'MAINTENANCE',
    typeLabel: 'Planned Maintenance',
    severity: 'WARNING',
    isActive: true,
    isSticky: false,
    requiresAck: false,
    sentAt: '2026-09-02T10:00:00Z',
    sentBy: 'Super Admin',
    isRead: false,
    isAcknowledged: false,
  },
  {
    id: 'bc-3',
    title: 'New Data Retention Policy — Effective October 1, 2026',
    body: 'In compliance with ISO 27001:2022 and our enterprise data governance framework, all team audit logs will be subject to a 90-day automated retention window starting October 1, 2026. All logs older than 90 days will be archived to cold storage. Please review the compliance documentation and confirm receipt by acknowledging this broadcast.',
    type: 'POLICY',
    typeLabel: 'Compliance Policy Update',
    severity: 'INFO',
    isActive: true,
    isSticky: false,
    requiresAck: true,
    sentAt: '2026-09-01T08:00:00Z',
    sentBy: 'Super Admin',
    isRead: true,
    isAcknowledged: false,
  },
];

// ─────────────────────────────────────────────
// Recent Workspace Activity Feed
// ─────────────────────────────────────────────
export const RECENT_WORKSPACE_ACTIVITY = [
  {
    id: 'a1',
    actorId: 'usr-dm',
    actor: 'Diana Morales',
    initials: 'DM',
    action: 'Elevated to DevSecOps Admin via Ticket #INC-8492',
    time: '18m ago',
    bgClass: 'bg-warning-bg text-on-tertiary-fixed',
  },
  {
    id: 'a2',
    actorId: 'usr-mv',
    actor: 'Marcus Vance',
    initials: 'MV',
    action: 'Deployed API service release v2.4.1 with zero downtime',
    time: '25m ago',
    bgClass: 'bg-primary text-on-primary',
  },
  {
    id: 'a3',
    actorId: 'usr-cd',
    actor: 'Charlie Davis',
    initials: 'CD',
    action: 'Provisioned bridge #infra-db-latency in Slack',
    time: '34m ago',
    bgClass: 'bg-surface-container-high text-on-surface',
  },
  {
    id: 'a4',
    actorId: 'usr-mv',
    actor: 'Marcus Vance',
    initials: 'MV',
    action: 'Completed task: Implement user profile caching layer',
    time: '1h ago',
    bgClass: 'bg-primary text-on-primary',
  },
  {
    id: 'a5',
    actorId: 'usr-aj',
    actor: 'Alice Johnson',
    initials: 'AJ',
    action: 'Deployed service-mesh-gateway v2.9.4 to Kubernetes',
    time: '1h ago',
    bgClass: 'bg-surface-container-high text-on-surface',
  },
  {
    id: 'a6',
    actorId: 'usr-mv',
    actor: 'Marcus Vance',
    initials: 'MV',
    action: 'Pushed 4 commits to branch feature/api-gateway-auth',
    time: '3h ago',
    bgClass: 'bg-primary text-on-primary',
  },
  {
    id: 'a7',
    actorId: 'usr-er',
    actor: 'Elena Rostova',
    initials: 'ER',
    action: 'Signed Q4 Credential Rotation Disclosure',
    time: '4h ago',
    bgClass: 'bg-surface-container-high text-on-surface',
  },
  {
    id: 'a8',
    actorId: 'usr-view',
    actor: 'Alex Rivera',
    initials: 'AR',
    action: 'Viewed sprint velocity and delivery metrics report',
    time: 'Yesterday',
    bgClass: 'bg-surface-container-high text-on-surface',
  },
];

export const WORKSPACE_ROLE_DEFINITIONS = {
  'Lead Architect': {
    description: 'Directs architecture, reviews security policies, and oversees platform reliability.',
    permissions: ['Team Administration', 'Architecture Governance', 'Task Full Access', 'JIT Access Approval', 'Audit Log Access'],
  },
  'Senior Staff SRE': {
    description: 'Oversees database clusters, infrastructure reliability, and production deployments.',
    permissions: ['Task Management', 'Deployment Approvals', 'System Monitoring', 'Infrastructure Write', 'Access Request'],
  },
  'DevOps Engineer': {
    description: 'Manages CI/CD pipelines, container orchestration, and cloud infrastructure.',
    permissions: ['Task Create & Update', 'CI/CD Pipelines', 'Infrastructure Read', 'Access Request'],
  },
  'Security Auditor': {
    description: 'Inspects compliance evidence, reviews access grants, and audits immutable logs.',
    permissions: ['Audit Log Read', 'Security Policy Inspection', 'Compliance Evidence Export', 'Access Request'],
  },
  'Senior Backend Developer': {
    description: 'Designs and builds API endpoints, database models, and service business logic.',
    permissions: ['Task Create & Update', 'API Deployment', 'Database Read/Write', 'Access Request'],
  },
  'Lead UI Engineer': {
    description: 'Maintains frontend design system, accessible components, and client-side state.',
    permissions: ['Task Create & Update', 'Frontend Release', 'Design Tokens Manage', 'Access Request'],
  },
  'Developer': {
    description: 'Standard engineering contributor with task implementation and code review access.',
    permissions: ['Task Create & Update', 'Code Deployment', 'Access Request'],
  },
  'QA Tester': {
    description: 'Executes automated testing workflows, regression validation, and defect logging.',
    permissions: ['Task Verification', 'Bug Tracking', 'Test Runner Execution', 'Access Request'],
  },
  'Project Manager': {
    description: 'Coordinates sprints, manages task backlogs, and generates team velocity reports.',
    permissions: ['Task Management', 'Sprint Planning', 'Team Reports Read', 'Access Request'],
  },
  'Viewer': {
    description: 'Read-only stakeholder with view permissions for dashboards, tasks, and members.',
    permissions: ['Task Read', 'Team Read', 'Dashboard Read'],
  },
};

