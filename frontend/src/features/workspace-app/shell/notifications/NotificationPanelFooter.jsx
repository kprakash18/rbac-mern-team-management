function NotificationPanelFooter({ onMarkAllAsRead, onOpenAnnouncements }) {
  return (
    <div className="p-2 border-t border-border-subtle bg-surface-container-low flex items-center justify-between text-[11px]">
      <button
        type="button"
        onClick={onOpenAnnouncements}
        className="text-primary hover:underline font-label-bold flex items-center gap-1 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[14px]">campaign</span>
        <span>Team Bulletins & Announcements</span>
      </button>
      <button
        type="button"
        onClick={onMarkAllAsRead}
        className="text-on-surface-variant hover:text-error font-label-bold cursor-pointer"
      >
        Mark all read
      </button>
    </div>
  );
}

export default NotificationPanelFooter;
