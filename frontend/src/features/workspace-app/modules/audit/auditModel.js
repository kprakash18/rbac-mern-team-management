export const CATEGORY_CONFIG = {
  ALL: { label: 'All Categories', icon: 'list' },
  JIT_ELEVATION: { label: 'JIT Elevation', icon: 'timer', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  ROLE_MANAGEMENT: { label: 'Roles & RBAC', icon: 'badge', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  MEMBERSHIP: { label: 'Membership', icon: 'group', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  TASK_OPERATIONS: { label: 'Tasks & Sprints', icon: 'assignment', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  SECURITY: { label: 'Security & Auth', icon: 'shield', color: 'text-red-700 bg-red-50 border-red-200' },
};

function resolveCategory(action) {
  const normalized = (action || '').toLowerCase();
  if (normalized.includes('access') || normalized.includes('grant') || normalized.includes('jit')) return 'JIT_ELEVATION';
  if (normalized.includes('role') || normalized.includes('permission')) return 'ROLE_MANAGEMENT';
  if (normalized.includes('membership') || normalized.includes('invite') || normalized.includes('member')) return 'MEMBERSHIP';
  if (normalized.includes('task')) return 'TASK_OPERATIONS';
  return 'SECURITY';
}

export function normalizeAuditLog(log) {
  const actor = log.actorId || {};
  return {
    id: log._id || log.id,
    _id: log._id || log.id,
    timestamp: log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
    isoDate: log.createdAt || new Date().toISOString(),
    actor: {
      name: actor.name || 'System',
      email: actor.email || 'system@internal',
      initials: (actor.name || 'S').slice(0, 2).toUpperCase(),
      role: actor.role || 'Member',
    },
    action: log.action || 'ACTION',
    actionLabel: (log.action || 'System Event').replace('.', ' ').toUpperCase(),
    category: resolveCategory(log.action),
    severity: log.result === 'FAILURE' ? 'CRITICAL' : 'INFO',
    resource: log.targetType || 'Resource',
    details: log.metadata
      ? (typeof log.metadata === 'object' ? Object.entries(log.metadata).map(([key, value]) => `${key}: ${value}`).join(' | ') : String(log.metadata))
      : `${log.action} performed successfully`,
    ipAddress: log.ipAddress || '127.0.0.1',
    status: log.result || 'SUCCESS',
  };
}
