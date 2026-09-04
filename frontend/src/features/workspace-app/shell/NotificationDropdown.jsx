import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'ACCESS_GRANTED',
    title: 'JIT Access Lease Approved',
    message: 'Temporary DB Read-Write lease granted for 60m on prod_cluster_primary.',
    timeAgo: '10m ago',
    targetTab: 'jit-request',
    readAt: null,
  },
  {
    id: 'notif-2',
    type: 'ROLE_ASSIGNED',
    title: 'Workspace Role Updated',
    message: 'You have been designated Lead Architect with Team Admin privileges.',
    timeAgo: '1h ago',
    targetTab: 'team-members',
    readAt: null,
  },
  {
    id: 'notif-3',
    type: 'INVITATION',
    title: 'Invitation Accepted',
    message: 'Rachel Zhang accepted the invitation and joined Acme Engineering.',
    timeAgo: '3h ago',
    targetTab: 'team-members',
    readAt: '2026-09-04T08:00:00.000Z',
  },
  {
    id: 'notif-4',
    type: 'TEAM_MEMBERSHIP',
    title: 'New Member Onboarded',
    message: 'Samuel Kim was provisioned as Senior Backend Developer.',
    timeAgo: 'Yesterday',
    targetTab: 'team-members',
    readAt: '2026-09-03T14:00:00.000Z',
  },
  {
    id: 'notif-5',
    type: 'SYSTEM',
    title: 'Scheduled Fleet Maintenance',
    message: 'Database failover drill scheduled for Sunday, 02:00 AM UTC (15m window).',
    timeAgo: 'Yesterday',
    targetTab: 'announcements',
    readAt: '2026-09-03T11:00:00.000Z',
  },
];

const NOTIF_CONFIG = {
  ACCESS_GRANTED: {
    icon: 'timer',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'JIT Access',
  },
  ACCESS_REQUEST: {
    icon: 'lock_open',
    bg: 'bg-primary-container text-on-primary-fixed border-primary/20',
    label: 'Access Request',
  },
  ROLE_ASSIGNED: {
    icon: 'badge',
    bg: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Role Change',
  },
  INVITATION: {
    icon: 'group_add',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Invitation',
  },
  TEAM_MEMBERSHIP: {
    icon: 'person',
    bg: 'bg-sky-100 text-sky-800 border-sky-200',
    label: 'Team Member',
  },
  SYSTEM: {
    icon: 'campaign',
    bg: 'bg-surface-container-high text-on-surface-variant border-border-subtle',
    label: 'System Notice',
  },
};

export default function NotificationDropdown({ currentUser, onSelectTab }) {
  const userId = currentUser?.id || 'usr-dm';
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  const storageKey = `workspace_user_notifications_${userId}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTIFICATIONS;
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications');
      const rawNotifs = res.data?.data?.notifications || res.data?.data || [];
      if (Array.isArray(rawNotifs) && rawNotifs.length > 0) {
        const formatted = rawNotifs.map((n) => ({
          id: n._id || n.id,
          type: n.type || 'SYSTEM',
          title: n.title || 'System Notification',
          message: n.message || n.content || '',
          timeAgo: n.createdAt ? 'Recently' : 'Just now',
          targetTab: n.targetTab || 'dashboard',
          readAt: n.isRead ? (n.readAt || new Date().toISOString()) : null,
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      console.warn('Backend notifications unavailable, using cached notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const persistNotifications = (nextList) => {
    setNotifications(nextList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
    } catch (err) {
      console.warn('Failed to mark all read in backend:', err);
    }
    const updated = notifications.map((n) => ({
      ...n,
      readAt: n.readAt || new Date().toISOString(),
    }));
    persistNotifications(updated);
  };

  const handleToggleRead = async (id) => {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isMongoId) {
      try {
        await api.patch(`/api/notifications/${id}/read`);
      } catch (err) {
        console.warn('Failed to mark notification read in backend:', err);
      }
    }
    const updated = notifications.map((n) => {
      if (n.id === id) {
        return { ...n, readAt: n.readAt ? null : new Date().toISOString() };
      }
      return n;
    });
    persistNotifications(updated);
  };

  const handleDeleteNotification = (id, e) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    persistNotifications(updated);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.readAt) {
      handleToggleRead(notif.id);
    }
    if (notif.targetTab && onSelectTab) {
      onSelectTab(notif.targetTab);
      setIsOpen(false);
    }
  };

  const displayedNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.readAt;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
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

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-container-lowest border border-border-subtle shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden max-h-[80vh]">
          {/* Header */}
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
                  onClick={handleMarkAllAsRead}
                  className="text-label-sm text-[12px] font-label-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">done_all</span>
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-lg text-[12px] font-label-bold transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-surface-container-lowest text-on-surface shadow-2xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unread')}
                className={`px-3 py-1 rounded-lg text-[12px] font-label-bold transition-colors cursor-pointer ${
                  filterTab === 'unread'
                    ? 'bg-surface-container-lowest text-on-surface shadow-2xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/60">
            {displayedNotifications.length === 0 ? (
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
            ) : (
              displayedNotifications.map((notif) => {
                const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.SYSTEM;
                const isUnread = !notif.readAt;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-surface-container/40 ${
                      isUnread ? 'bg-primary/5 font-medium' : 'bg-surface-container-lowest'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${config.bg}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {config.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-label-bold text-label-sm text-on-surface truncate">
                          {notif.title}
                        </span>
                        <span className="text-[11px] text-on-surface-variant shrink-0">
                          {notif.timeAgo}
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant leading-snug mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant/80">
                          {config.label}
                        </span>
                        {notif.targetTab && (
                          <span className="text-[11px] font-label-bold text-primary hover:underline inline-flex items-center gap-0.5">
                            <span>Open view</span>
                            <span className="material-symbols-outlined text-[13px]">
                              chevron_right
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right actions: unread dot & delete */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                      {isUnread && (
                        <span
                          className="w-2 h-2 rounded-full bg-primary"
                          title="Unread"
                        ></span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                        className="opacity-0 hover:opacity-100 focus:opacity-100 p-0.5 rounded text-on-surface-variant hover:text-error hover:bg-surface-container transition-opacity cursor-pointer"
                        title="Dismiss notification"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2 border-t border-border-subtle bg-surface-container-low flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('announcements');
                setIsOpen(false);
              }}
              className="text-primary hover:underline font-label-bold flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">campaign</span>
              <span>Team Bulletins & Announcements</span>
            </button>
            <button
              type="button"
              onClick={() => persistNotifications([])}
              className="text-on-surface-variant hover:text-error font-label-bold cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
