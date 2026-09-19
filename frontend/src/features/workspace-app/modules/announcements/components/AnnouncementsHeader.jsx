function AnnouncementsHeader({ canBroadcast, onBroadcast, unreadCount }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            System Bulletins &amp; Broadcasts
          </h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Platform-wide alerts, deployment notices, and compliance bulletins
        </p>
      </div>

      {canBroadcast ? (
        <button
          type="button"
          onClick={onBroadcast}
          className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-sm text-label-sm transition-opacity shadow-sm cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          <span>+ Broadcast System Message</span>
        </button>
      ) : (
        <div
          className="flex items-center gap-xs px-md py-2 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm opacity-60 cursor-not-allowed border border-border-subtle select-none"
          title="Permission required to broadcast system messages"
        >
          <span className="material-symbols-outlined text-[18px]">lock</span>
          <span>Broadcast (Restricted)</span>
        </div>
      )}
    </div>
  );
}

export default AnnouncementsHeader;
