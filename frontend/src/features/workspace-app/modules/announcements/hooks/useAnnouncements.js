import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/useApp';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { createLocalBroadcast, normalizeBroadcast } from '../announcementModel';

const INITIAL_FORM = {
  title: '',
  type: 'ANNOUNCEMENT',
  body: '',
  isSticky: false,
  requiresAck: false,
};

export function useAnnouncements({ announcements, currentUser, onAddAnnouncement, workspace }) {
  const { activeWorkspace, hasPermission: appHasPermission } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [teamBroadcasts, setTeamBroadcasts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const hasPermission = useCallback((permission) => {
    if (currentUser?.hasPermission) return currentUser.hasPermission(permission);
    if (appHasPermission) return appHasPermission(permission);
    if (isTeamAdmin || currentUser?.isSuperAdmin) return true;
    const perms = currentUser?.permissions || [];
    return perms.includes(permission) || perms.includes('*');
  }, [currentUser, appHasPermission, isTeamAdmin]);

  const canBroadcast = hasPermission('notification.create') || hasPermission('broadcast.create') || isTeamAdmin;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBroadcasts = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await api.get(`/api/teams/${teamId}/broadcasts`);
      setTeamBroadcasts((res.data?.data || []).map(normalizeBroadcast));
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    }
  }, [teamId]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleNewBroadcast = () => fetchBroadcasts();
    socket.on('broadcast:new', handleNewBroadcast);
    socket.on('notification:new', handleNewBroadcast);

    return () => {
      socket.off('broadcast:new', handleNewBroadcast);
      socket.off('notification:new', handleNewBroadcast);
    };
  }, [fetchBroadcasts]);

  const handleOpenBroadcastModal = () => {
    setForm(INITIAL_FORM);
    setIsBroadcastModalOpen(true);
  };

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmitBroadcast = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      showToast('Please enter both a headline and message body.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (teamId) {
        const res = await api.post(`/api/teams/${teamId}/broadcasts`, {
          title: form.title.trim(),
          body: form.body.trim(),
          type: form.type,
          isSticky: form.isSticky,
          requiresAck: form.requiresAck,
        });

        const created = res.data?.data;
        const formattedNew = {
          ...createLocalBroadcast({
            body: form.body.trim(),
            currentUser,
            isSticky: form.isSticky,
            requiresAck: form.requiresAck,
            title: form.title.trim(),
            type: form.type,
          }),
          id: created?._id || `bc-${Date.now()}`,
        };

        setTeamBroadcasts((prev) => [formattedNew, ...prev]);
        onAddAnnouncement?.(formattedNew);
      }
      setIsBroadcastModalOpen(false);
      showToast(' System broadcast dispatched to all team members!');
    } catch (err) {
      console.error('Failed to send broadcast:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to dispatch broadcast.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayAnnouncements = teamBroadcasts.length > 0 ? teamBroadcasts : announcements;

  return {
    canBroadcast,
    displayAnnouncements,
    expandedId,
    form,
    isBroadcastModalOpen,
    submitting,
    toast,
    unreadCount: displayAnnouncements.filter((announcement) => !announcement.isRead).length,
    handleOpenBroadcastModal,
    handleSubmitBroadcast,
    setExpandedId,
    setIsBroadcastModalOpen,
    updateForm,
  };
}
