import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getStorage, setStorage } from '@/lib/storage';
import { getSocket } from '@/lib/socket';

const FALLBACK_GENERAL = {
  id: 'grp-general',
  name: 'general',
  topic: 'Workspace general chat channel',
  memberIds: [],
  isDefault: true,
};

const INITIAL_MESSAGES = {};

export function useChatEngine(teamId, currentUser) {
  const currentUserId = currentUser?._id || currentUser?.id || 'usr-current';
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);

  const [teamMembers, setTeamMembers] = useState([]);
  const [groups, setGroups] = useState([FALLBACK_GENERAL]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState('grp-general');
  const [messages, setMessages] = useState(() =>
    teamId ? getStorage(`workspace_chat_messages_${teamId}`, INITIAL_MESSAGES) : INITIAL_MESSAGES
  );

  const [inputText, setInputText] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  // Editing & Deleting Messages State
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessage, setDeletingMessage] = useState(null);

  // Channel deletion & leaving confirmation state
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(null);
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([currentUserId]);

  // Invite Members to Active Group State
  const [inviteSelectedIds, setInviteSelectedIds] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch team members
  useEffect(() => {
    if (!teamId) return;
    api
      .get(`/api/teams/${teamId}/members`)
      .then((res) => {
        const raw = res.data?.data?.members || res.data?.data || [];
        const formatted = raw.map((m) => {
          const u = m.user || m.userId || {};
          const name = u.name || m.name || 'Member';
          const userId = String(
            u._id || u.id || (typeof m.userId === 'string' ? m.userId : null) || m._id || m.id
          );
          return {
            id: userId,
            userId,
            membershipId: m._id || m.id,
            name,
            email: u.email || m.email || '',
            role: m.roles?.[0]?.name || m.role?.name || m.role || 'Member',
            teamRole: m.roles?.[0]?.name || m.role?.name || m.role || 'Member',
            initials: name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
          };
        });
        setTeamMembers(formatted);
      })
      .catch((err) => console.error('Failed to load chat team members:', err));
  }, [teamId]);

  // Load channels from backend whenever teamId changes
  const fetchChannels = useCallback(async () => {
    if (!teamId) return;
    setChannelsLoading(true);
    try {
      const res = await api.get(`/api/teams/${teamId}/channels`);
      const fetched = res.data?.data || [];
      const normalized = fetched.map((ch) => ({
        ...ch,
        id: String(ch._id || ch.id),
        memberIds: (ch.memberIds || []).map(String),
      }));
      setGroups(normalized.length > 0 ? normalized : [FALLBACK_GENERAL]);
      setActiveGroupId((prev) => {
        const stillExists = normalized.some(
          (ch) => String(ch._id || ch.id) === prev || ch.id === prev
        );
        if (stillExists) return prev;
        const general = normalized.find((ch) => ch.isDefault);
        return general ? String(general._id || general.id) : normalized[0]?.id || 'grp-general';
      });
    } catch (err) {
      console.error('Failed to load channels:', err);
      setGroups([FALLBACK_GENERAL]);
    } finally {
      setChannelsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchChannels();
    const storedMessages = teamId
      ? getStorage(`workspace_chat_messages_${teamId}`, INITIAL_MESSAGES)
      : INITIAL_MESSAGES;
    setMessages(storedMessages);
  }, [fetchChannels, teamId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const rawActiveMessages = messages[activeGroupId] || [];

  // Deduplicate active messages by ID and collapse temporary local messages
  const activeMessages = (() => {
    const seen = new Set();
    const serverMsgKeys = new Set(
      rawActiveMessages
        .filter((m) => m._id && !String(m.id).startsWith('msg-'))
        .map((m) => `${m.senderId}_${m.text}`)
    );

    return rawActiveMessages.filter((m) => {
      const key = m._id || m.id;
      if (seen.has(key)) return false;
      seen.add(key);

      if (String(m.id).startsWith('msg-') && serverMsgKeys.has(`${m.senderId}_${m.text}`)) {
        return false;
      }
      return true;
    });
  })();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeGroupId, messages, scrollToBottom]);

  // Real-time WebSocket connection & room subscription
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setIsSocketLive(false);
      return;
    }

    if (socket.connected) {
      setIsSocketLive(true);
    }

    const onConnect = () => setIsSocketLive(true);
    const onDisconnect = () => setIsSocketLive(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (teamId) {
      socket.emit('team:join', { teamId }, (res) => {
        if (res?.ok) {
          socket.emit('chat:history', { teamId, groupId: activeGroupId, limit: 50 }, (histRes) => {
            if (histRes?.ok && histRes.messages) {
              const formattedMsgs = histRes.messages.map((m) => ({
                id: m._id || m.id,
                _id: m._id || m.id,
                groupId: m.groupId || activeGroupId,
                senderId: m.sender?.id || m.sender?._id || m.senderId || 'member',
                senderName: m.sender?.name || m.senderName || 'Team Member',
                senderRole: m.sender?.role || 'Member',
                senderInitials: (m.sender?.name || 'M')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase(),
                text: m.content || m.text,
                isEdited: Boolean(m.isEdited),
                timestamp: m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent',
                createdAt: m.createdAt,
              }));

              setMessages((prev) => {
                const existing = prev[activeGroupId] || [];
                const serverMsgKeys = new Set(formattedMsgs.map((f) => `${f.senderId}_${f.text}`));
                const cleanedExisting = existing.filter(
                  (e) =>
                    !String(e.id).startsWith('msg-') || !serverMsgKeys.has(`${e.senderId}_${e.text}`)
                );
                const existingIds = new Set(cleanedExisting.map((e) => e._id || e.id));
                const newOnly = formattedMsgs.filter((n) => !existingIds.has(n._id || n.id));
                const merged = [...cleanedExisting, ...newOnly];
                const next = { ...prev, [activeGroupId]: merged };
                if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
                return next;
              });
            }
          });
        }
      });

      const onChatMessage = (incomingMsg) => {
        if (!incomingMsg || (incomingMsg.teamId && incomingMsg.teamId !== teamId)) return;
        const msgId = incomingMsg._id || incomingMsg.id;
        const targetGroupId = incomingMsg.groupId || activeGroupId;
        const senderId = incomingMsg.sender?.id || incomingMsg.sender?._id || incomingMsg.senderId;
        const content = incomingMsg.content || incomingMsg.text;

        const normalized = {
          id: msgId,
          _id: msgId,
          groupId: targetGroupId,
          senderId,
          senderName: incomingMsg.sender?.name || incomingMsg.senderName || 'Team Member',
          senderRole: incomingMsg.sender?.role || 'Member',
          senderInitials: (incomingMsg.sender?.name || 'M')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          text: content,
          isEdited: Boolean(incomingMsg.isEdited),
          timestamp: incomingMsg.createdAt
            ? new Date(incomingMsg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now',
          createdAt: incomingMsg.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => {
          const currentGroupMsgs = prev[targetGroupId] || [];
          if (currentGroupMsgs.some((m) => m._id === msgId || m.id === msgId)) {
            return prev;
          }

          const tempIdx = currentGroupMsgs.findIndex(
            (m) =>
              (!m._id || String(m.id).startsWith('msg-')) &&
              String(m.senderId) === String(senderId) &&
              m.text === content
          );

          let updated;
          if (tempIdx !== -1) {
            updated = [...currentGroupMsgs];
            updated[tempIdx] = normalized;
          } else {
            updated = [...currentGroupMsgs, normalized];
          }

          const next = { ...prev, [targetGroupId]: updated };
          if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
          return next;
        });
      };

      const onMessageUpdated = (data) => {
        if (!data?.messageId) return;
        setMessages((prev) => {
          const targetGroupId = data.groupId || activeGroupId;
          const currentGroupMsgs = prev[targetGroupId] || [];
          const nextGroupMsgs = currentGroupMsgs.map((m) =>
            m.id === data.messageId || m._id === data.messageId
              ? { ...m, text: data.content, isEdited: true }
              : m
          );
          const next = { ...prev, [targetGroupId]: nextGroupMsgs };
          if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
          return next;
        });
      };

      const onMessageDeleted = (data) => {
        if (!data?.messageId) return;
        setMessages((prev) => {
          const targetGroupId = data.groupId || activeGroupId;
          const currentGroupMsgs = prev[targetGroupId] || [];
          const nextGroupMsgs = currentGroupMsgs.filter(
            (m) => m.id !== data.messageId && m._id !== data.messageId
          );
          const next = { ...prev, [targetGroupId]: nextGroupMsgs };
          if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
          return next;
        });
      };

      const onUserTyping = (data) => {
        if (!data?.userId || data.userId === currentUserId) return;
        if (data.teamId && data.teamId !== teamId) return;
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: { name: data.userName || 'Someone', timestamp: Date.now() },
        }));
      };

      socket.on('chat:message', onChatMessage);
      socket.on('chat:message_updated', onMessageUpdated);
      socket.on('chat:message_deleted', onMessageDeleted);
      socket.on('chat:typing', onUserTyping);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('chat:message', onChatMessage);
        socket.off('chat:message_updated', onMessageUpdated);
        socket.off('chat:message_deleted', onMessageDeleted);
        socket.off('chat:typing', onUserTyping);
      };
    }
  }, [teamId, activeGroupId, currentUserId]);

  const handleSendMessage = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!inputText.trim()) return;

      const textToSend = inputText.trim();
      setInputText('');

      const tempId = `msg-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        groupId: activeGroupId,
        senderId: currentUserId,
        senderName: currentUser?.name || 'You',
        senderRole: currentUser?.role || 'Developer',
        senderInitials: (currentUser?.name || 'U')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const next = {
          ...prev,
          [activeGroupId]: [...(prev[activeGroupId] || []), optimisticMsg],
        };
        if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
        return next;
      });

      const socket = getSocket();
      if (socket && isSocketLive && teamId) {
        socket.emit(
          'chat:send',
          {
            teamId,
            groupId: activeGroupId,
            content: textToSend,
            senderName: currentUser?.name || 'You',
            senderRole: currentUser?.role || 'Developer',
          },
          (res) => {
            if (res?.ok && res.message) {
              const serverMsg = res.message;
              setMessages((prev) => {
                const currentList = prev[activeGroupId] || [];
                const updatedList = currentList.map((m) =>
                  m.id === tempId
                    ? {
                        ...m,
                        id: serverMsg._id || serverMsg.id,
                        _id: serverMsg._id || serverMsg.id,
                        timestamp: new Date(serverMsg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      }
                    : m
                );
                const next = { ...prev, [activeGroupId]: updatedList };
                if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
                return next;
              });
            }
          }
        );
      }
    },
    [inputText, activeGroupId, currentUserId, currentUser, isSocketLive, teamId]
  );

  const handleTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !teamId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socket.emit('chat:typing', {
      teamId,
      groupId: activeGroupId,
      userName: currentUser?.name || 'Someone',
    });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }, [teamId, activeGroupId, currentUser]);

  const handleEditMessage = useCallback(
    async (messageId, newContent) => {
      if (!newContent.trim()) return;
      const socket = getSocket();
      if (socket && teamId) {
        socket.emit('chat:edit', {
          teamId,
          groupId: activeGroupId,
          messageId,
          content: newContent.trim(),
        });
      }

      setMessages((prev) => {
        const currentGroupMsgs = prev[activeGroupId] || [];
        const nextGroupMsgs = currentGroupMsgs.map((m) =>
          m.id === messageId || m._id === messageId
            ? { ...m, text: newContent.trim(), isEdited: true }
            : m
        );
        const next = { ...prev, [activeGroupId]: nextGroupMsgs };
        if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
        return next;
      });

      setEditingMessageId(null);
      setEditingText('');
    },
    [teamId, activeGroupId]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      const socket = getSocket();
      if (socket && teamId) {
        socket.emit('chat:delete', {
          teamId,
          groupId: activeGroupId,
          messageId,
        });
      }

      setMessages((prev) => {
        const currentGroupMsgs = prev[activeGroupId] || [];
        const nextGroupMsgs = currentGroupMsgs.filter(
          (m) => m.id !== messageId && m._id !== messageId
        );
        const next = { ...prev, [activeGroupId]: nextGroupMsgs };
        if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
        return next;
      });

      setDeletingMessage(null);
    },
    [teamId, activeGroupId]
  );

  return {
    teamMembers,
    groups,
    channelsLoading,
    activeGroupId,
    setActiveGroupId,
    activeGroup,
    activeMessages,
    messages,
    inputText,
    setInputText,
    searchChannel,
    setSearchChannel,
    isSocketLive,
    typingUsers,
    editingMessageId,
    setEditingMessageId,
    editingText,
    setEditingText,
    deletingMessage,
    setDeletingMessage,
    confirmDeleteGroup,
    setConfirmDeleteGroup,
    confirmLeaveGroup,
    setConfirmLeaveGroup,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isInviteModalOpen,
    setIsInviteModalOpen,
    newGroupName,
    setNewGroupName,
    newGroupTopic,
    setNewGroupTopic,
    selectedMemberIds,
    setSelectedMemberIds,
    inviteSelectedIds,
    setInviteSelectedIds,
    messagesEndRef,
    isTeamAdmin,
    currentUserId,
    handleSendMessage,
    handleTyping,
    handleEditMessage,
    handleDeleteMessage,
    fetchChannels,
  };
}
