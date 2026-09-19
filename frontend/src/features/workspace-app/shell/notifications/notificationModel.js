export const NOTIF_CONFIG = {
  USER_ROLE_CHANGED: { icon: 'badge', bg: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Role Change' },
  USER_STATUS_CHANGED: { icon: 'manage_accounts', bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Status Change' },
  USER_ACCESS_CHANGED: { icon: 'security', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Access Change' },
  GROUP_MEMBER_ADDED: { icon: 'group_add', bg: 'bg-sky-100 text-sky-800 border-sky-200', label: 'Team Member' },
  ROLE_ASSIGNED: { icon: 'badge', bg: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Role Change' },
  ROLE_REVOKED: { icon: 'badge', bg: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Role Revoked' },
  PERMISSION_CHANGED: { icon: 'security', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Permissions' },
  TEAM_MEMBERSHIP: { icon: 'group', bg: 'bg-sky-100 text-sky-800 border-sky-200', label: 'Team Member' },
  CHANNEL_ADDED: { icon: 'chat', bg: 'bg-violet-100 text-violet-800 border-violet-200', label: 'Team Channel' },
  INVITATION: { icon: 'group_add', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Invitation' },
  INVITATION_RECEIVED: { icon: 'group_add', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Invitation' },
  INVITATION_ACCEPTED: { icon: 'how_to_reg', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Invite Accepted' },
  TASK_ASSIGNED: { icon: 'assignment_ind', bg: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Task Assigned' },
  TASK_UNASSIGNED: { icon: 'assignment_late', bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Task Removed' },
  TASK_STATUS_CHANGED: { icon: 'published_with_changes', bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Task Status' },
  TASK_COMPLETED: { icon: 'task_alt', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Task Completed' },
  TASK_DUE_DATE_CHANGED: { icon: 'event', bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Task Due Date' },
  ACCESS_GRANTED: { icon: 'key', bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'JIT Access' },
  ACCESS_REQUEST: { icon: 'lock_open', bg: 'bg-primary-container text-on-primary-fixed border-primary/20', label: 'Access Request' },
  ACCESS_REVOKED: { icon: 'lock', bg: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Access Revoked' },
  SYSTEM: { icon: 'campaign', bg: 'bg-surface-container-high text-on-surface-variant border-border-subtle', label: 'System Notice' },
};

export function resolveTargetTab(notification) {
  const resourceType = notification.resourceType || '';
  const type = notification.type || '';

  if (resourceType === 'TASK' || type.startsWith('TASK_')) return 'tasks';
  if (resourceType === 'CHANNEL' || type === 'CHANNEL_ADDED') return 'chat';
  if (resourceType === 'ACCESS_REQUEST' || resourceType === 'ACCESS_GRANT' || type.startsWith('ACCESS_') || type === 'USER_ACCESS_CHANGED') return 'jit-request';
  if (type === 'USER_ROLE_CHANGED' || type === 'USER_STATUS_CHANGED' || type === 'GROUP_MEMBER_ADDED') return 'team-members';
  if (resourceType === 'ROLE' || type.startsWith('ROLE_') || type === 'PERMISSION_CHANGED') return 'team-members';
  if (resourceType === 'MEMBERSHIP' || resourceType === 'INVITATION' || type.startsWith('INVITATION_') || type === 'TEAM_MEMBERSHIP') return 'team-members';

  return 'dashboard';
}

export function normalizeNotification(notification) {
  return {
    id: notification._id || notification.id,
    type: notification.type || 'SYSTEM',
    resourceType: notification.resourceType || 'SYSTEM',
    resourceId: notification.resourceId || null,
    title: notification.title || 'System Notification',
    message: notification.message || notification.content || '',
    timeAgo: notification.createdAt
      ? new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Recently',
    targetTab: resolveTargetTab(notification),
    readAt: notification.readAt || null,
    metadata: notification.metadata || {},
  };
}

export function persistWhenIdle(storageKey, notifications) {
  const persist = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch {}
  };

  if (typeof requestIdleCallback === 'function') requestIdleCallback(persist);
  else setTimeout(persist, 0);
}
