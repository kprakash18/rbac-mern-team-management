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
  { id: 'teams', label: 'Teams & Workspaces', icon: 'groups', path: 'teams' },
  { id: 'roles-rbac', label: 'Roles & Permissions', icon: 'admin_panel_settings', path: 'roles-rbac' },
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

export const DEFAULT_PLATFORM_ROLES = [
  { id: 'r-super-admin', name: 'Super Administrator', type: 'system', isSystem: true, description: 'Full platform governance, security administration, and tenant control.', permissionKeys: ['user.read', 'user.create', 'user.update', 'user.delete', 'team.read', 'team.create', 'team.update', 'team.delete', 'role.read', 'role.create', 'role.update', 'role.delete'] },
  { id: 'r-team-admin', name: 'Team Admin', type: 'system', isSystem: true, description: 'Workspace and team administrator with permission to manage members and settings.', permissionKeys: ['team.read', 'team.update', 'membership.read', 'membership.create', 'membership.update', 'membership.remove', 'task.read', 'task.create', 'task.update', 'task.delete'] },
  { id: 'r-ws-lead', name: 'Workspace Lead', type: 'custom', isSystem: false, description: 'Squad lead supervising sprint backlogs, task delegation, and team workflows.', permissionKeys: ['task.read', 'task.create', 'task.update', 'team.read', 'membership.read'] },
  { id: 'r-lead-arch', name: 'Lead Architect', type: 'custom', isSystem: false, description: 'Directs architecture, reviews security policies, and oversees platform reliability.', permissionKeys: ['team.read', 'team.update', 'task.read', 'task.create', 'task.update', 'access_request.approve'] },
  { id: 'r-sr-eng', name: 'Senior Engineer', type: 'custom', isSystem: false, description: 'Senior engineering contributor, code reviews, API integrations, and sprint execution.', permissionKeys: ['task.read', 'task.create', 'task.update', 'access_request.create'] },
  { id: 'r-dev', name: 'Developer', type: 'custom', isSystem: false, description: 'Standard engineering contributor with task implementation and code review access.', permissionKeys: ['task.read', 'task.create', 'task.update', 'access_request.create'] },
  { id: 'r-sr-dev', name: 'Senior Backend Developer', type: 'custom', isSystem: false, description: 'Designs and builds backend services, database schemas, and microservices.', permissionKeys: ['task.read', 'task.create', 'task.update', 'access_request.create'] },
  { id: 'r-lead-ui', name: 'Lead UI Engineer', type: 'custom', isSystem: false, description: 'Maintains frontend design systems, accessible components, and client-side state.', permissionKeys: ['task.read', 'task.create', 'task.update', 'access_request.create'] },
  { id: 'r-devops', name: 'DevOps Engineer', type: 'custom', isSystem: false, description: 'Manages CI/CD pipelines, container orchestration, and cloud infrastructure.', permissionKeys: ['task.read', 'task.create', 'task.update', 'access_request.create'] },
  { id: 'r-sre', name: 'Site Reliability Engineer', type: 'custom', isSystem: false, description: 'Maintains production uptime, monitors SLO/SLA alerts, and incident response.', permissionKeys: ['task.read', 'task.update', 'audit.read', 'access_request.create'] },
  { id: 'r-sr-sre', name: 'Senior Staff SRE', type: 'custom', isSystem: false, description: 'Oversees database clusters, infrastructure reliability, and production deployments.', permissionKeys: ['task.read', 'task.update', 'audit.read', 'access_request.create'] },
  { id: 'r-sec-audit', name: 'Security Auditor', type: 'custom', isSystem: false, description: 'Inspects compliance evidence, reviews access grants, and audits immutable logs.', permissionKeys: ['audit.read', 'role.read', 'permission.read', 'team.read'] },
  { id: 'r-comp-audit', name: 'Compliance Auditor', type: 'custom', isSystem: false, description: 'Read-only audit trail access, regulatory compliance logs, and policy inspection.', permissionKeys: ['audit.read', 'role.read', 'permission.read', 'team.read'] },
  { id: 'r-data-sci', name: 'Data Scientist', type: 'custom', isSystem: false, description: 'Builds predictive models, data analytics pipelines, and reporting dashboards.', permissionKeys: ['task.read', 'task.create', 'task.update'] },
  { id: 'r-ml-eng', name: 'ML Engineer', type: 'custom', isSystem: false, description: 'Builds and deploys machine learning pipelines, model serving, and evaluations.', permissionKeys: ['task.read', 'task.create', 'task.update'] },
  { id: 'r-lead-res', name: 'Lead Researcher', type: 'custom', isSystem: false, description: 'Directs foundational research initiatives, experimentation, and prototypes.', permissionKeys: ['task.read', 'task.create', 'task.update', 'team.read'] },
  { id: 'r-prod-mgr', name: 'Product Manager', type: 'custom', isSystem: false, description: 'Defines product roadmaps, requirements, user stories, and acceptance criteria.', permissionKeys: ['task.read', 'task.create', 'task.update', 'team.read'] },
  { id: 'r-proj-mgr', name: 'Project Manager', type: 'custom', isSystem: false, description: 'Coordinates sprints, manages task backlogs, and generates team velocity reports.', permissionKeys: ['task.read', 'task.create', 'task.update', 'team.read'] },
  { id: 'r-qa-eng', name: 'QA Engineer', type: 'custom', isSystem: false, description: 'Executes automated test suites, end-to-end testing, and regression suites.', permissionKeys: ['task.read', 'task.create', 'task.update'] },
  { id: 'r-qa-tester', name: 'QA Tester', type: 'custom', isSystem: false, description: 'Manual feature validation, defect logging, and user acceptance testing.', permissionKeys: ['task.read', 'task.create', 'task.update'] },
  { id: 'r-rel-mgr', name: 'Release Manager', type: 'custom', isSystem: false, description: 'Orchestrates deployment stages, canary testing, and release tagging.', permissionKeys: ['task.read', 'task.update', 'audit.read'] },
  { id: 'r-prod-admin', name: 'Production Admin', type: 'custom', isSystem: false, description: 'Production environment management, incident command, and rollback gates.', permissionKeys: ['task.read', 'task.update', 'audit.read'] },
  { id: 'r-mkt-mgr', name: 'Campaign Manager', type: 'custom', isSystem: false, description: 'Manages marketing campaigns, multichannel distribution, and conversion metrics.', permissionKeys: ['task.read', 'task.create', 'task.update'] },
  { id: 'r-cnt-creator', name: 'Content Creator', type: 'custom', isSystem: false, description: 'Creates marketing copy, creative media assets, and digital publication content.', permissionKeys: ['task.read', 'task.create', 'task.update'] },
  { id: 'r-seo-spec', name: 'SEO Specialist', type: 'custom', isSystem: false, description: 'Monitors search engine ranking, keyword analysis, and content indexing.', permissionKeys: ['task.read', 'task.update'] },
  { id: 'r-fin-ctrl', name: 'Finance Controller', type: 'custom', isSystem: false, description: 'Oversees financial approvals, subscription billing, and budget allocations.', permissionKeys: ['task.read', 'audit.read'] },
  { id: 'r-bill-admin', name: 'Billing Admin', type: 'custom', isSystem: false, description: 'Manages payment methods, invoice receipts, and plan subscriptions.', permissionKeys: ['task.read', 'audit.read'] },
  { id: 'r-sup-lead', name: 'Support Lead', type: 'custom', isSystem: false, description: 'Supervises support queues, customer escalation tickets, and SLA performance.', permissionKeys: ['task.read', 'task.create', 'task.update'] },
  { id: 'r-t2-agent', name: 'Tier 2 Agent', type: 'custom', isSystem: false, description: 'Handles complex technical escalations and customer support investigations.', permissionKeys: ['task.read', 'task.update'] },
  { id: 'r-t1-spec', name: 'Tier 1 Specialist', type: 'custom', isSystem: false, description: 'First-line customer inquiry response and basic ticket resolution.', permissionKeys: ['task.read', 'task.update'] },
  { id: 'r-viewer', name: 'Viewer', type: 'system', isSystem: true, description: 'Read-only stakeholder with view permissions for dashboards, tasks, and members.', permissionKeys: ['team.read', 'task.read', 'notification.read'] },
];
