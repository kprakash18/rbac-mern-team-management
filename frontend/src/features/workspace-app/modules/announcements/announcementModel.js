export const TYPE_CONFIG = {
  OUTAGE: { icon: 'gpp_maybe', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'P0 Outage' },
  MAINTENANCE: { icon: 'construction', badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', label: 'Deployment & Maintenance' },
  POLICY: { icon: 'policy', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500', label: 'Security Policy' },
  ANNOUNCEMENT: { icon: 'campaign', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'General Notice' },
};

export function normalizeBroadcast(broadcast) {
  const typeConfig = TYPE_CONFIG[broadcast.type] || TYPE_CONFIG.ANNOUNCEMENT;
  const isGlobal = !broadcast.teamId ||
    broadcast.scope === 'GLOBAL' ||
    (broadcast.targetWorkspaces || []).some((target) => typeof target === 'string' && target.includes('All Workspaces'));
  const senderRole = isGlobal ? 'Super Admin' : 'Team Admin';
  const senderName = broadcast.senderId?.name || broadcast.senderId?.email || (isGlobal ? 'Platform Super Admin' : 'Team Admin');

  return {
    id: broadcast._id || broadcast.id,
    _id: broadcast._id || broadcast.id,
    title: broadcast.title,
    body: broadcast.body || broadcast.message,
    type: broadcast.type || 'ANNOUNCEMENT',
    typeLabel: typeConfig.label,
    severity: broadcast.severity || (broadcast.type === 'OUTAGE' ? 'CRITICAL' : 'INFO'),
    isActive: broadcast.status === 'ACTIVE',
    isSticky: Boolean(broadcast.isSticky),
    isGlobal,
    requiresAck: Boolean(broadcast.requiresAck),
    sentAt: broadcast.createdAt || new Date().toISOString(),
    sentBy: `${senderName} (${senderRole})`,
    isRead: false,
    isAcknowledged: false,
  };
}

export function createLocalBroadcast({ body, currentUser, isSticky, requiresAck, title, type }) {
  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.ANNOUNCEMENT;
  return {
    id: `bc-${Date.now()}`,
    title,
    body,
    type,
    typeLabel: typeConfig.label,
    severity: type === 'OUTAGE' ? 'CRITICAL' : type === 'MAINTENANCE' ? 'WARNING' : 'INFO',
    isActive: true,
    isSticky,
    requiresAck,
    sentAt: new Date().toISOString(),
    sentBy: `${currentUser?.name || 'Admin'} (${currentUser?.teamRoleTitle || 'Team Admin'})`,
    isRead: false,
    isAcknowledged: false,
  };
}
