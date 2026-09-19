import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { FALLBACK_GENERAL, normalizeChannel } from './chatModel';

export function useChatChannels({ currentUserId, isTeamAdmin, teamId }) {
  const [groups, setGroups] = useState([FALLBACK_GENERAL]);
  const [activeGroupId, setActiveGroupId] = useState('grp-general');
  const [searchChannel, setSearchChannel] = useState('');
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(null);
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([currentUserId]);
  const [inviteSelectedIds, setInviteSelectedIds] = useState([]);

  const fetchChannels = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await api.get(`/api/teams/${teamId}/channels`);
      const normalized = (res.data?.data || []).map(normalizeChannel);
      setGroups(normalized.length > 0 ? normalized : [FALLBACK_GENERAL]);
      setActiveGroupId((prev) => {
        if (normalized.some((channel) => String(channel._id || channel.id) === prev || channel.id === prev)) return prev;
        const general = normalized.find((channel) => channel.isDefault);
        return general ? String(general._id || general.id) : (normalized[0]?.id || 'grp-general');
      });
    } catch {
      setGroups([FALLBACK_GENERAL]);
    }
  }, [teamId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const activeGroup = groups.find((group) => group.id === activeGroupId) || groups[0] || FALLBACK_GENERAL;

  const visibleGroups = groups.filter((group) => {
    const isMember = isTeamAdmin || group.isDefault || (group.memberIds || []).includes(currentUserId);
    const matchesSearch = !searchChannel || group.name.toLowerCase().includes(searchChannel.toLowerCase());
    return isMember && matchesSearch;
  });

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!newGroupName.trim() || !teamId) return;
    try {
      const payload = {
        name: newGroupName.trim().toLowerCase().replace(/\s+/g, '-'),
        topic: newGroupTopic.trim() || undefined,
        memberIds: Array.from(new Set([currentUserId, ...selectedMemberIds])),
      };
      const res = await api.post(`/api/teams/${teamId}/channels`, payload);
      const created = res.data?.data;
      if (created) {
        setGroups((prev) => [...prev, normalizeChannel(created)]);
        setActiveGroupId(String(created._id || created.id));
      }
      setIsCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupTopic('');
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleInviteMembers = async (event) => {
    event.preventDefault();
    if (!inviteSelectedIds.length || !teamId) return;
    try {
      const res = await api.post(`/api/teams/${teamId}/channels/${activeGroupId}/members`, { memberIds: inviteSelectedIds });
      const updated = res.data?.data;
      if (updated) {
        setGroups((prev) => (
          prev.map((group) => (group.id === activeGroupId ? { ...group, memberIds: (updated.memberIds || []).map(String) } : group))
        ));
      }
      setIsInviteModalOpen(false);
      setInviteSelectedIds([]);
    } catch (err) {
      console.error('Failed to invite members:', err);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!teamId || group.isDefault) return;
    try {
      await api.delete(`/api/teams/${teamId}/channels/${group.id}`);
      setGroups((prev) => prev.filter((item) => item.id !== group.id));
      setActiveGroupId('grp-general');
      setConfirmDeleteGroup(null);
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  const handleLeaveGroup = async (group) => {
    if (!teamId || group.isDefault) return;
    try {
      await api.post(`/api/teams/${teamId}/channels/${group.id}/leave`);
      setGroups((prev) => (
        prev.map((item) => (item.id === group.id ? { ...item, memberIds: item.memberIds.filter((id) => id !== currentUserId) } : item))
      ));
      setActiveGroupId('grp-general');
      setConfirmLeaveGroup(null);
    } catch (err) {
      console.error('Failed to leave channel:', err);
    }
  };

  const handleToggleCreateMember = (memberId, isSelected) => {
    setSelectedMemberIds((prev) => (
      isSelected ? [...prev, memberId] : prev.filter((id) => id !== memberId)
    ));
  };

  const handleToggleInviteMember = (memberId, isSelected) => {
    setInviteSelectedIds((prev) => (
      isSelected ? [...prev, memberId] : prev.filter((id) => id !== memberId)
    ));
  };

  return {
    activeGroup,
    activeGroupId,
    confirmDeleteGroup,
    confirmLeaveGroup,
    fetchChannels,
    groups,
    inviteSelectedIds,
    isCreateModalOpen,
    isInviteModalOpen,
    newGroupName,
    newGroupTopic,
    searchChannel,
    selectedMemberIds,
    visibleGroups,
    handleCreateGroup,
    handleDeleteGroup,
    handleInviteMembers,
    handleLeaveGroup,
    handleToggleCreateMember,
    handleToggleInviteMember,
    setActiveGroupId,
    setConfirmDeleteGroup,
    setConfirmLeaveGroup,
    setIsCreateModalOpen,
    setIsInviteModalOpen,
    setNewGroupName,
    setNewGroupTopic,
    setSearchChannel,
  };
}
