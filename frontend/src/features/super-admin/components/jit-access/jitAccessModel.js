function getRequester(request) {
  return request.requesterId && typeof request.requesterId === 'object' ? request.requesterId : {};
}

function getPermission(request) {
  return request.permissionId && typeof request.permissionId === 'object' ? request.permissionId : {};
}

function getTeam(request) {
  return request.teamId && typeof request.teamId === 'object' ? request.teamId : {};
}

function getReviewer(request) {
  return request.reviewedBy && typeof request.reviewedBy === 'object' ? request.reviewedBy : {};
}

function getUserSummary(request, bgClass = 'bg-primary-container text-on-primary') {
  const requester = getRequester(request);
  const name = requester.name || requester.email || 'Team Admin';
  return {
    name,
    email: requester.email || '',
    initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'TA',
    bgClass,
  };
}

function getDurationLabel(request) {
  if (!request.durationHours) return `${request.durationMinutes || 120}m`;
  return request.durationHours < 1 ? `${Math.round(request.durationHours * 60)}m` : `${request.durationHours}h`;
}

export function normalizePendingRequest(request) {
  const permission = getPermission(request);
  const team = getTeam(request);
  return {
    id: request._id || request.id,
    _id: request._id || request.id,
    user: getUserSummary(request),
    workspace: team.name || 'Workspace',
    teamId: team._id || request.teamId,
    permission: permission.name || permission.key || 'Custom Permission',
    permBadgeClass: 'bg-primary/10 text-primary border-primary/20',
    targetResource: request.resource || '*',
    reason: request.reason || 'Operational task',
    justification: request.reason || 'Operational task',
    requestedDuration: getDurationLabel(request),
    submittedAt: request.createdAt
      ? new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
    timeRemainingSec: (request.durationHours || 2) * 3600,
    approvalLevel: request.approvalLevel || 'SUPER_ADMIN',
  };
}

export function normalizeActiveGrant(request) {
  const permission = getPermission(request);
  const team = getTeam(request);
  const reviewer = getReviewer(request);
  const remainingSeconds = request.expiresAt
    ? Math.max(0, Math.floor((new Date(request.expiresAt) - new Date()) / 1000))
    : 3600;

  return {
    id: request._id || request.id,
    _id: request._id || request.id,
    user: getUserSummary(request),
    workspace: team.name || 'Workspace',
    teamId: team._id || request.teamId,
    permission: permission.name || permission.key || 'Custom Permission',
    permBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    targetResource: request.resource || '*',
    grantedBy: reviewer.name || 'Super Admin',
    grantedAt: request.reviewedAt || request.updatedAt
      ? new Date(request.reviewedAt || request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
    remainingSeconds,
    totalSeconds: (request.durationHours || 2) * 3600,
  };
}

export function normalizeHistoryItem(request) {
  const permission = getPermission(request);
  const team = getTeam(request);
  const reviewer = getReviewer(request);
  return {
    id: request._id || request.id,
    _id: request._id || request.id,
    user: getUserSummary(request, 'bg-surface-container-high text-on-surface'),
    workspace: team.name || 'Workspace',
    permission: permission.name || permission.key || 'Custom Permission',
    permBadgeClass: 'bg-surface-container text-on-surface border-border-subtle',
    targetResource: request.resource || '*',
    grantedBy: reviewer.name || 'Super Admin',
    outcome: request.status,
    outcomeClass:
      request.status === 'REJECTED'
        ? 'bg-warning-bg text-warning-text border-warning-bg'
        : request.status === 'REVOKED'
        ? 'bg-error-bg text-error-text border-error-container'
        : 'bg-surface-variant text-on-surface-variant border-surface-variant',
    duration: `${request.durationHours || 2}h`,
    endedAt: request.updatedAt
      ? new Date(request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
    reason: request.rejectionReason || 'Closed',
  };
}

export function getExpiredHistoryItem(grant) {
  return {
    id: `hist-${Date.now()}-${grant.id}`,
    user: grant.user,
    workspace: grant.workspace,
    permission: grant.permission,
    permBadgeClass: grant.permBadgeClass,
    targetResource: grant.targetResource,
    grantedBy: grant.grantedBy,
    outcome: 'EXPIRED',
    outcomeClass: 'bg-surface-variant text-on-surface-variant border-surface-variant',
    duration: `${Math.round((grant.totalSeconds || 3600) / 60)} Mins`,
    endedAt: 'Just now',
    reason: 'TTL duration elapsed automatically.',
  };
}
