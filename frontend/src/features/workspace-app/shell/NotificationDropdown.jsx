import { memo } from 'react';
import NotificationList from './notifications/NotificationList';
import NotificationPanelFooter from './notifications/NotificationPanelFooter';
import NotificationPanelHeader from './notifications/NotificationPanelHeader';
import NotificationTrigger from './notifications/NotificationTrigger';
import { useNotificationsDropdown } from './notifications/useNotificationsDropdown';

function NotificationDropdown({ currentUser, onSelectTab }) {
  const {
    displayedNotifications,
    dropdownRef,
    filterTab,
    isLoading,
    isOpen,
    notifications,
    unreadCount,
    handleDeleteNotification,
    handleMarkAllAsRead,
    handleNotificationClick,
    handleOpenAnnouncements,
    setFilterTab,
    setIsOpen,
  } = useNotificationsDropdown({ currentUser, onSelectTab });

  return (
    <div className="relative" ref={dropdownRef}>
      <NotificationTrigger
        isOpen={isOpen}
        unreadCount={unreadCount}
        onToggle={() => setIsOpen((prev) => !prev)}
      />

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-container-lowest border border-border-subtle shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden max-h-[80vh]">
          <NotificationPanelHeader
            filterTab={filterTab}
            notificationCount={notifications.length}
            unreadCount={unreadCount}
            onMarkAllAsRead={handleMarkAllAsRead}
            onTabChange={setFilterTab}
          />

          <NotificationList
            filterTab={filterTab}
            isLoading={isLoading}
            notifications={displayedNotifications}
            totalNotifications={notifications.length}
            onDelete={handleDeleteNotification}
            onNotificationClick={handleNotificationClick}
          />

          <NotificationPanelFooter
            onMarkAllAsRead={handleMarkAllAsRead}
            onOpenAnnouncements={handleOpenAnnouncements}
          />
        </div>
      )}
    </div>
  );
}

export default memo(NotificationDropdown);
