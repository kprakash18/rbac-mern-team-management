function NotificationTrigger({ isOpen, onToggle, unreadCount }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
        isOpen
          ? 'bg-surface-container text-primary font-bold'
          : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
      }`}
      title="Notification Center"
      aria-label="Notification Center"
    >
      <span className="material-symbols-outlined text-[20px]">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationTrigger;
