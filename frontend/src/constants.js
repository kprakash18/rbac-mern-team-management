// ============================================================================
// APPLICATION UNIFIED CONSTANTS
// Single consolidated source of truth for canonical permissions, UI enums,
// navigation schemas, and system role mappings.
// Real API data is used across all views and components.
// ============================================================================

// ============================================================================
// SECTION: INVITATION CONSTANTS
// ============================================================================

export const INVITATION_STATES = {
  NEW_USER: 'NEW_USER',
  EXISTING_USER: 'EXISTING_USER',
  INVALID_TOKEN: 'INVALID_TOKEN',
};

// ============================================================================
// SECTION: ROLES & CANONICAL PERMISSIONS CATALOG
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
  USER_MGMT: 'User Management',
  SECURITY: 'Security & Policy',
  TEAM_MGMT: 'Workspaces & Teams',
};

// ============================================================================
// SECTION: JIT ACCESS & ROLES
// ============================================================================

export const AVAILABLE_JIT_ROLES = [
  { id: 'DB_READ_ONLY', label: 'Database Read-Only', icon: 'storage', risk: 'Low' },
  { id: 'DB_ADMIN', label: 'Database Admin (Full)', icon: 'database', risk: 'Critical' },
  { id: 'K8S_READ', label: 'Kubernetes Read', icon: 'cloud', risk: 'Low' },
  { id: 'K8S_WRITE', label: 'Kubernetes Write', icon: 'cloud_upload', risk: 'High' },
  { id: 'CI_ADMIN', label: 'CI/CD Pipeline Admin', icon: 'build', risk: 'High' },
  { id: 'SECRETS_READ', label: 'Secrets Manager Read', icon: 'lock', risk: 'Medium' },
  { id: 'INFRA_DEPLOY', label: 'Infrastructure Deploy', icon: 'rocket_launch', risk: 'Critical' },
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
