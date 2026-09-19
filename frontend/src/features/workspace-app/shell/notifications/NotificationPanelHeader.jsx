function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-[12px] font-label-bold transition-colors cursor-pointer ${
        active
          ? 'bg-surface-container-lowest text-on-surface shadow-2xs font-bold'
          : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}

function NotificationPanelHeader({
  filterTab,
  notificationCount,
  onMarkAllAsRead,
  onTabChange,
  unreadCount,
}) {
  return (
    <div className="p-md pb-2 border-b border-border-subtle bg-surface-container-low flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-label-bold text-label-md text-on-surface font-semibold">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-label-sm text-[12px] font-label-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">done_all</span>
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <TabButton active={filterTab === 'all'} onClick={() => onTabChange('all')}>
          All ({notificationCount})
        </TabButton>
        <TabButton active={filterTab === 'unread'} onClick={() => onTabChange('unread')}>
          Unread ({unreadCount})
        </TabButton>
      </div>
    </div>
  );
}

export default NotificationPanelHeader;
