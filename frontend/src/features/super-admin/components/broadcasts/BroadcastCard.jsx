import { BROADCAST_TYPES } from '../../constants/broadcasts.constants';

export default function BroadcastCard({
  broadcast,
  onOpenDetails,
  onEdit,
  onEndEarly,
  onDelete,
}) {
  const typeConfig = BROADCAST_TYPES[broadcast.type] || BROADCAST_TYPES.ANNOUNCEMENT;

  const getStatusBadge = () => {
    switch (broadcast.status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-success-bg text-success-text text-[12px] font-semibold inline-flex items-center gap-1 border border-success-bg">
            <span className="h-1.5 w-1.5 rounded-full bg-success-text animate-pulse"></span>
            Active
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-warning-bg text-warning-text text-[12px] font-semibold inline-flex items-center gap-1 border border-warning-bg">
            <span className="h-1.5 w-1.5 rounded-full bg-warning-text"></span>
            Scheduled
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[12px] font-semibold inline-flex items-center gap-1">
            Draft
          </span>
        );
      case 'ENDED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[12px] font-semibold inline-flex items-center gap-1">
            Ended
          </span>
        );
    }
  };

  const getPercentage = () => {
    if (!broadcast.metrics?.targetedUsers) return 0;
    return Math.round((broadcast.metrics.viewedCount / broadcast.metrics.targetedUsers) * 100);
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-md sm:p-lg shadow-sm border border-surface-variant flex flex-col gap-sm hover:shadow-md transition-shadow">
      {/* Top Row: Type & Status & Timing */}
      <div className="flex flex-wrap items-center justify-between gap-xs">
        <div className="flex items-center gap-xs flex-wrap">
          {/* Type Tag */}
          <span
            className={`px-2.5 py-0.5 rounded-md text-[12px] font-bold inline-flex items-center gap-1 border ${typeConfig.badgeClass}`}
          >
            <span className="material-symbols-outlined text-[15px]">{typeConfig.icon}</span>
            <span>{typeConfig.label}</span>
          </span>

          {/* Status Badge */}
          {getStatusBadge()}
        </div>

        <span className="text-[12px] text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">schedule</span>
          <span>{broadcast.timeLabel}</span>
        </span>
      </div>

      {/* Title & Message */}
      <div>
        <h3 className="font-headline-md text-[16px] sm:text-[18px] font-bold text-on-surface">
          {broadcast.title}
        </h3>
        <p className="font-body-base text-body-sm sm:text-body-base text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
          {broadcast.message}
        </p>
      </div>

      {/* Target Audience & Read Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm bg-surface-container-low p-sm rounded-lg text-[12px]">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
            {broadcast.scope === 'GLOBAL' ? 'public' : broadcast.scope === 'ROLE_SCOPED' ? 'shield_person' : 'corporate_fare'}
          </span>
          <div>
            <span className="text-on-surface-variant block text-[11px]">Target Audience:</span>
            <span className="font-semibold text-on-surface truncate max-w-[240px] block">
              {broadcast.scope === 'GLOBAL'
                ? 'All Employees (Global Fleet)'
                : broadcast.scope === 'ROLE_SCOPED'
                ? `Roles: ${broadcast.targetRoles?.join(', ') || 'Targeted Roles'}`
                : broadcast.targetWorkspaces?.join(', ') || 'Targeted Workspaces'}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-on-surface-variant">Fleet Delivery &amp; Read Rate:</span>
            <span className="font-bold text-on-surface">
              {getPercentage()}% ({broadcast.metrics?.viewedCount} / {broadcast.metrics?.targetedUsers})
            </span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                broadcast.type === 'OUTAGE'
                  ? 'bg-error'
                  : broadcast.type === 'POLICY'
                  ? 'bg-primary'
                  : broadcast.type === 'MAINTENANCE'
                  ? 'bg-warning-text'
                  : 'bg-success-text'
              }`}
              style={{ width: `${getPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-sm pt-xs border-t border-surface-variant/50">
        <span className="text-[11px] text-on-surface-variant">
          Created by <strong className="text-on-surface">{broadcast.createdBy}</strong>
        </span>

        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={() => onOpenDetails(broadcast)}
            className="px-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-label-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">analytics</span>
            <span>View Details</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(broadcast)}
            className="px-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-label-bold transition-colors cursor-pointer"
          >
            Edit
          </button>

          {broadcast.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => onEndEarly(broadcast)}
              className="px-sm py-1 rounded-lg text-error hover:bg-error-bg text-[12px] font-label-bold transition-colors cursor-pointer"
            >
              End Early
            </button>
          )}

          {broadcast.status !== 'ACTIVE' && (
            <button
              type="button"
              onClick={() => onDelete(broadcast)}
              className="px-sm py-1 rounded-lg text-on-surface-variant hover:text-error text-[12px] font-label-bold transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
