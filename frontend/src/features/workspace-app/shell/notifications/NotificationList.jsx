import { NOTIF_CONFIG } from './notificationModel';

function LoadingState() {
  return (
    <div className="p-xl text-center flex flex-col items-center gap-2">
      <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
      <span className="text-body-sm text-on-surface-variant">Loading notifications...</span>
    </div>
  );
}

function EmptyState({ filterTab }) {
  return (
    <div className="p-xl text-center flex flex-col items-center gap-2">
      <span className="material-symbols-outlined text-outline text-[32px]">
        notifications_paused
      </span>
      <span className="text-body-sm text-on-surface-variant">
        {filterTab === 'unread'
          ? 'You are all caught up! No unread notifications.'
          : 'No notifications at this time.'}
      </span>
    </div>
  );
}

function NotificationItem({ notification, onClick, onDelete }) {
  const config = NOTIF_CONFIG[notification.type] || NOTIF_CONFIG.SYSTEM;
  const isUnread = !notification.readAt;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-surface-container/40 ${
        isUnread ? 'bg-primary/5 font-medium' : 'bg-surface-container-lowest'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${config.bg}`}>
        <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-bold text-label-sm text-on-surface truncate">
            {notification.title}
          </span>
          <span className="text-[11px] text-on-surface-variant shrink-0">
            {notification.timeAgo}
          </span>
        </div>
        <p className="text-[12px] text-on-surface-variant leading-snug mt-0.5 line-clamp-2">
          {notification.message}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant/80">
            {config.label}
          </span>
          {notification.targetTab && (
            <span className="text-[11px] font-label-bold text-primary hover:underline inline-flex items-center gap-0.5">
              <span>Open view</span>
              <span className="material-symbols-outlined text-[13px]">chevron_right</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
        {isUnread && <span className="w-2 h-2 rounded-full bg-primary" title="Unread"></span>}
        <button
          type="button"
          onClick={(event) => onDelete(notification.id, event)}
          className="opacity-0 hover:opacity-100 focus:opacity-100 p-0.5 rounded text-on-surface-variant hover:text-error hover:bg-surface-container transition-opacity cursor-pointer"
          title="Dismiss notification"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>
  );
}

function NotificationList({
  filterTab,
  isLoading,
  notifications,
  totalNotifications,
  onDelete,
  onNotificationClick,
}) {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/60">
      {isLoading && totalNotifications === 0 ? (
        <LoadingState />
      ) : notifications.length === 0 ? (
        <EmptyState filterTab={filterTab} />
      ) : (
        notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={onNotificationClick}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

export default NotificationList;
