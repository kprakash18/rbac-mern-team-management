import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

const NOTIF_CONFIG = {
  // Canonical Types
  USER_ROLE_CHANGED: {
    icon: 'badge',
    bg: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Role Change',
  },
  USER_STATUS_CHANGED: {
    icon: 'manage_accounts',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Status Change',
  },
  USER_ACCESS_CHANGED: {
    icon: 'security',
    bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    label: 'Access Change',
  },
  GROUP_MEMBER_ADDED: {
    icon: 'group_add',
    bg: 'bg-sky-100 text-sky-800 border-sky-200',
    label: 'Team Member',
  },

  // Role & Permissions
  ROLE_ASSIGNED: {
    icon: 'badge',
    bg: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Role Change',
  },
  ROLE_REVOKED: {
    icon: 'badge',
    bg: 'bg-rose-100 text-rose-800 border-rose-200',
    label: 'Role Revoked',
  },
  PERMISSION_CHANGED: {
    icon: 'security',
    bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    label: 'Permissions',
  },

  // Team & Channel
  TEAM_MEMBERSHIP: {
    icon: 'group',
    bg: 'bg-sky-100 text-sky-800 border-sky-200',
    label: 'Team Member',
  },
  CHANNEL_ADDED: {
    icon: 'chat',
    bg: 'bg-violet-100 text-violet-800 border-violet-200',
    label: 'Team Channel',
  },
  INVITATION: {
    icon: 'group_add',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Invitation',
  },
  INVITATION_RECEIVED: {
    icon: 'group_add',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Invitation',
  },
  INVITATION_ACCEPTED: {
    icon: 'how_to_reg',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Invite Accepted',
  },

  // Tasks
  TASK_ASSIGNED: {
    icon: 'assignment_ind',
    bg: 'bg-teal-100 text-teal-800 border-teal-200',
    label: 'Task Assigned',
  },
  TASK_UNASSIGNED: {
    icon: 'assignment_late',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Task Removed',
  },
  TASK_STATUS_CHANGED: {
    icon: 'published_with_changes',
    bg: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Task Status',
  },
  TASK_COMPLETED: {
    icon: 'task_alt',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Task Completed',
  },
  TASK_DUE_DATE_CHANGED: {
    icon: 'event',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Task Due Date',
  },

  // JIT & Access Grants
  ACCESS_GRANTED: {
    icon: 'key',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'JIT Access',
  },
  ACCESS_REQUEST: {
    icon: 'lock_open',
    bg: 'bg-primary-container text-on-primary-fixed border-primary/20',
    label: 'Access Request',
  },
  ACCESS_REVOKED: {
    icon: 'lock',
    bg: 'bg-rose-100 text-rose-800 border-rose-200',
    label: 'Access Revoked',
  },

  // System
  SYSTEM: {
    icon: 'campaign',
    bg: 'bg-surface-container-high text-on-surface-variant border-border-subtle',
    label: 'System Notice',
  },
};

function resolveTargetTab(notif) {
  const resourceType = notif.resourceType || '';
  const type = notif.type || '';

  if (resourceType === 'TASK' || type.startsWith('TASK_')) return 'tasks';
  if (resourceType === 'CHANNEL' || type === 'CHANNEL_ADDED') return 'chat';
  if (resourceType === 'ACCESS_REQUEST' || resourceType === 'ACCESS_GRANT' || type.startsWith('ACCESS_') || type === 'USER_ACCESS_CHANGED') return 'jit-request';
  if (type === 'USER_ROLE_CHANGED' || type === 'USER_STATUS_CHANGED' || type === 'GROUP_MEMBER_ADDED') return 'team-members';
  if (resourceType === 'ROLE' || type.startsWith('ROLE_') || type === 'PERMISSION_CHANGED') return 'team-members';
  if (resourceType === 'MEMBERSHIP' || resourceType === 'INVITATION' || type.startsWith('INVITATION_') || type === 'TEAM_MEMBERSHIP') return 'team-members';

  return 'dashboard';
}

export default function NotificationDropdown({ currentUser, onSelectTab }) {
  const userId = currentUser?._id || currentUser?.id || 'usr-current';
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  const storageKey = `workspace_user_notifications_${userId}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/unread-count');
      if (typeof res.data?.data?.unreadCount === 'number') {
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/notifications');
      const rawNotifs = res.data?.data?.notifications || res.data?.data || [];
      if (Array.isArray(rawNotifs)) {
        const formatted = rawNotifs.map((n) => ({
          id: n._id || n.id,
          type: n.type || 'SYSTEM',
          resourceType: n.resourceType || 'SYSTEM',
          resourceId: n.resourceId || null,
          title: n.title || 'System Notification',
          message: n.message || n.content || '',
          timeAgo: n.createdAt
            ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recently',
          targetTab: resolveTargetTab(n),
          readAt: n.readAt || null,
          metadata: n.metadata || {},
        }));
        setNotifications(formatted);
        try {
          localStorage.setItem(storageKey, JSON.stringify(formatted));
        } catch {}

        if (typeof res.data?.data?.unreadCount === 'number') {
          setUnreadCount(res.data.data.unreadCount);
        } else {
          setUnreadCount(formatted.filter((n) => !n.readAt).length);
        }
      }
    } catch (err) {
      console.warn('Backend notifications unavailable:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.readAt).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
    fetchNotifications();
    fetchUnreadCount();
  }, [userId, storageKey, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Real-time notification socket listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewNotif = () => {
      fetchNotifications();
      fetchUnreadCount();
    };

    const onCountUpdate = (data) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    socket.on('notification:new', onNewNotif);
    socket.on('notification:count', onCountUpdate);
    socket.on('access:changed', onNewNotif);

    return () => {
      socket.off('notification:new', onNewNotif);
      socket.off('notification:count', onCountUpdate);
      socket.off('access:changed', onNewNotif);
    };
  }, [fetchNotifications, fetchUnreadCount]);

  // Handle outside click
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
    setUnreadCount(nextList.filter((n) => !n.readAt).length);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch {}
  };

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

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isMongoId) {
      try {
        await api.delete(`/api/notifications/${id}`);
      } catch (err) {
        console.warn('Failed to delete notification in backend:', err);
      }
    }
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
            {isLoading && notifications.length === 0 ? (
              <div className="p-xl text-center flex flex-col items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span className="text-body-sm text-on-surface-variant">Loading notifications...</span>
              </div>
            ) : displayedNotifications.length === 0 ? (
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
              onClick={() => handleMarkAllAsRead()}
              className="text-on-surface-variant hover:text-error font-label-bold cursor-pointer"
            >
              Mark all read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
