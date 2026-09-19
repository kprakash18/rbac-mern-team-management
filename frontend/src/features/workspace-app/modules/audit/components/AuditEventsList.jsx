import { EmptyState } from '@/shared/components';
import { CATEGORY_CONFIG } from '../auditModel';

function AuditEventsList({ events, loading, onSelectEvent }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
          <span className="text-[13px] font-medium">Loading workspace audit events...</span>
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon="search_off" title="No audit events found" message="Try resetting filters or adjusting search terms." />
      ) : (
        <div className="divide-y divide-border-subtle">
          {events.map((event) => {
            const categoryConfig = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.SECURITY;
            return (
              <div key={event.id} onClick={() => onSelectEvent(event)} className="p-3.5 sm:p-4 flex items-start justify-between gap-3 hover:bg-surface-container-low/60 transition-colors cursor-pointer group">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 bg-primary text-on-primary">
                    {event.actor.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-bold text-[13px] text-on-surface">{event.actor.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${categoryConfig.color}`}>
                        <span className="material-symbols-outlined text-[12px]">{categoryConfig.icon}</span>
                        <span>{event.actionLabel}</span>
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${event.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300' : event.severity === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'}`}>
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant leading-snug mt-1">{event.details}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant font-mono">
                      <span>Target: <span className="text-on-surface font-semibold">{event.resource}</span></span>
                      <span>IP: {event.ipAddress}</span>
                      <span>Event ID: {event.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-on-surface-variant font-mono">{event.timestamp}</span>
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">chevron_right</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AuditEventsList;
