// ─────────────────────────────────────────────
// Current Logged-In Employee (Mock Session)
// ─────────────────────────────────────────────
export const MOCK_CURRENT_USER = {
  id: 'usr_alice_j',
  name: 'Alice Johnson',
  email: 'alice.j@example.com',
  initials: 'AJ',
  role: 'Lead Architect',
  accountStatus: 'ACTIVE',
};

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
// Team Members Directory
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
// My JIT Access Grant History
// ─────────────────────────────────────────────
export const MY_JIT_HISTORY = [
  {
    id: 'req_k8s_88',
    requestedRole: 'K8S_WRITE',
    requestedRoleLabel: 'Kubernetes Write Access',
    justification: 'Hotfix patch deployment for ingestion runner memory leak',
    ticketId: 'OPS-3920',
    requestedDuration: '2h',
    status: 'APPROVED',
    statusLabel: 'Active',
    approvedBy: 'Super Admin',
    expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 min from now
    createdAt: '2026-09-03T11:20:15Z',
  },
  {
    id: 'req_db_read_72',
    requestedRole: 'DB_READ_ONLY',
    requestedRoleLabel: 'Database Read-Only',
    justification: 'Investigating slow query performance in prod-replica-1',
    ticketId: 'ENG-8842',
    requestedDuration: '1h',
    status: 'EXPIRED',
    statusLabel: 'Expired',
    approvedBy: 'Super Admin',
    expiresAt: '2026-09-02T16:00:00Z',
    createdAt: '2026-09-02T15:00:00Z',
  },
  {
    id: 'req_ci_admin_60',
    requestedRole: 'CI_ADMIN',
    requestedRoleLabel: 'CI/CD Pipeline Admin',
    justification: 'Reconfigure GitHub Actions runner environment variables',
    ticketId: 'DEVOPS-441',
    requestedDuration: '30m',
    status: 'REJECTED',
    statusLabel: 'Rejected',
    rejectionReason: 'CI admin access not permitted without security review.',
    expiresAt: null,
    createdAt: '2026-09-01T09:30:00Z',
  },
];

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
  { id: 'a1', actor: 'Diana Morales', action: 'Deployed ingestion runner v2.4.1', time: '8 mins ago', icon: 'rocket_launch', iconClass: 'text-success-text' },
  { id: 'a2', actor: 'Ben Kaur', action: 'Merged PR #2841 — rate-limit middleware', time: '32 mins ago', icon: 'merge_type', iconClass: 'text-primary' },
  { id: 'a3', actor: 'Alice Johnson', action: 'Requested JIT K8S Write access', time: '1 hour ago', icon: 'timer', iconClass: 'text-warning-text' },
  { id: 'a4', actor: 'Carlos Torres', action: 'Closed task TASK-992 — fix null ref', time: '2 hours ago', icon: 'task_alt', iconClass: 'text-success-text' },
  { id: 'a5', actor: 'Priya Sharma', action: 'Added Nina Weber to workspace', time: 'Yesterday', icon: 'person_add', iconClass: 'text-on-surface-variant' },
];
