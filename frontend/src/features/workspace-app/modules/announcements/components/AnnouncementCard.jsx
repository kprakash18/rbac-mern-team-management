import { TYPE_CONFIG } from '../announcementModel';

function AnnouncementCard({
  announcement,
  isExpanded,
  onAcknowledge,
  onMarkRead,
  onToggle,
}) {
  const typeConfig = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.ANNOUNCEMENT;

  return (
    <div
      className={`bg-surface-container-lowest rounded-xl border shadow-xs overflow-hidden transition-all ${
        !announcement.isRead ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border-subtle'
      }`}
    >
      <div className="p-md flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${typeConfig.badge}`}>
          <span className="material-symbols-outlined text-[20px]">{typeConfig.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeConfig.badge}`}>
              {announcement.typeLabel}
            </span>
            {announcement.isSticky && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">push_pin</span>
                Pinned Banner
              </span>
            )}
            {!announcement.isRead && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">NEW</span>
            )}
            {announcement.requiresAck && !announcement.isAcknowledged && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Signature Required
              </span>
            )}
            {announcement.isAcknowledged && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">check</span>
                Acknowledged
              </span>
            )}
          </div>

          <h3 className="font-label-bold text-on-surface text-[15px] leading-snug">{announcement.title}</h3>

          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1">
            <span className="font-medium text-on-surface">{announcement.sentBy}</span>
            <span>•</span>
            <span className="font-mono">
              {new Date(announcement.sentAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-md pb-md">
          <div className="bg-surface-container-low rounded-xl p-3.5 text-[13px] text-on-surface leading-relaxed border border-border-subtle/70">
            {announcement.body}
          </div>

          {announcement.requiresAck && !announcement.isAcknowledged && (
            <button
              type="button"
              onClick={() => onAcknowledge?.(announcement.id)}
              className="mt-3 flex items-center gap-1.5 px-md py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">draw</span>
              I acknowledge and accept this notice
            </button>
          )}
        </div>
      )}

      <div className="px-md pb-3 pt-1 border-t border-border-subtle/60 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggle(announcement)}
          className="text-[12px] text-primary font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
        >
          {isExpanded ? 'Collapse Notice' : 'Read Full Message'}
          <span className="material-symbols-outlined text-[15px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {!announcement.isRead && (
          <button
            type="button"
            onClick={() => onMarkRead?.(announcement.id)}
            className="text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer font-medium"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
}

export default AnnouncementCard;
