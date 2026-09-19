import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { normalizeNotification, persistWhenIdle } from './notificationModel';

const STALE_MS = 30_000;

export function useNotificationsDropdown({ currentUser, onSelectTab }) {
  const userId = currentUser?._id || currentUser?.id || '';
  const storageKey = `workspace_user_notifications_${userId}`;
  const dropdownRef = useRef(null);
  const lastFetchRef = useRef(0);

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [unreadCount, setUnreadCount] = useState(() => notifications.filter((notification) => !notification.readAt).length);

  const persistNotifications = useCallback(
    (nextList) => {
      const clamped = nextList.slice(0, 100);
      setNotifications(clamped);
      setUnreadCount(clamped.filter((notification) => !notification.readAt).length);
      persistWhenIdle(storageKey, clamped);
    },
    [storageKey]
  );

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/notifications');
      const rawNotifications = res.data?.data?.notifications || res.data?.data || [];
      if (Array.isArray(rawNotifications)) {
        const formatted = rawNotifications.map(normalizeNotification);
        setNotifications(formatted);
        persistWhenIdle(storageKey, formatted);
        setUnreadCount(
          typeof res.data?.data?.unreadCount === 'number'
            ? res.data.data.unreadCount
            : formatted.filter((notification) => !notification.readAt).length
        );
      }
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.warn('Backend notifications unavailable:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    fetchNotifications();
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (isOpen && Date.now() - lastFetchRef.current > STALE_MS) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onNewNotification = () => fetchNotifications();
    const onCountUpdate = (data) => {
      if (typeof data?.unreadCount === 'number') setUnreadCount(data.unreadCount);
    };

    socket.on('notification:new', onNewNotification);
    socket.on('notification:count', onCountUpdate);
    socket.on('access:changed', onNewNotification);

    return () => {
      socket.off('notification:new', onNewNotification);
      socket.off('notification:count', onCountUpdate);
      socket.off('access:changed', onNewNotification);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
    } catch (err) {
      console.warn('Failed to mark all read in backend:', err);
    }
    persistNotifications(notifications.map((notification) => ({
      ...notification,
      readAt: notification.readAt || new Date().toISOString(),
    })));
  };

  const handleToggleRead = async (id) => {
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        await api.patch(`/api/notifications/${id}/read`);
      } catch (err) {
        console.warn('Failed to mark notification read in backend:', err);
      }
    }
    persistNotifications(notifications.map((notification) => (
      notification.id === id
        ? { ...notification, readAt: notification.readAt ? null : new Date().toISOString() }
        : notification
    )));
  };

  const handleDeleteNotification = async (id, event) => {
    event.stopPropagation();
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        await api.delete(`/api/notifications/${id}`);
      } catch (err) {
        console.warn('Failed to delete notification in backend:', err);
      }
    }
    persistNotifications(notifications.filter((notification) => notification.id !== id));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.readAt) handleToggleRead(notification.id);
    if (notification.targetTab && onSelectTab) {
      onSelectTab(notification.targetTab);
      setIsOpen(false);
    }
  };

  const handleOpenAnnouncements = () => {
    onSelectTab?.('announcements');
    setIsOpen(false);
  };

  return {
    displayedNotifications: notifications.filter((notification) => filterTab !== 'unread' || !notification.readAt),
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
  };
}
