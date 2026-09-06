export const PRIORITY_STYLES = {
  URGENT: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  HIGH: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  MEDIUM: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  LOW: 'bg-slate-50 text-slate-500 border-slate-200 font-medium',
  Urgent: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  High: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  Medium: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  Low: 'bg-slate-50 text-slate-500 border-slate-200 font-medium',
};

export const STATUS_STYLES = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  IN_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 font-medium',
};

export const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled' },
];
