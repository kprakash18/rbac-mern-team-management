export const DURATIONS = ['30m', '1h', '2h', '4h', '8h'];

export const RISK_BADGES = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-red-50 text-red-700 border-red-200 font-semibold',
};

export const STATUS_BADGES = {
  PENDING: { label: 'Pending Approval', class: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Active Lease', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPIRED: { label: 'Expired', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  REVOKED: { label: 'Revoked Early', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  REJECTED: { label: 'Rejected', class: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelled', class: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const SUPER_ADMIN_ONLY_PERMISSIONS = new Set([
  'permission.assign',
  'role.create',
  'role.delete',
  'role.update',
  'team.create',
  'team.delete',
  'user.create',
  'user.delete',
  'user.update',
]);

export const JIT_STATUS_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Active Leases' },
  { key: 'PAST', label: 'History' },
];
