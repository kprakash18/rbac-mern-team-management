import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { getStorage, setStorage } from '@/lib/storage';
import { dedupeMessages, normalizeHistoryMessage, normalizeIncomingMessage } from './chatModel';

export function useChatMessages({
  activeGroupId,
  canBroadcast,
  currentUser,
  currentUserId,
  fetchChannels,
  teamId,
}) {
  const [messages, setMessages] = useState(() => (
    teamId ? getStorage(`workspace_chat_messages_${teamId}`, {}) : {}
  ));
  const [inputText, setInputText] = useState('');
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isSystemBroadcastMode, setIsSystemBroadcastMode] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const persistMessages = useCallback(
    (updater) => {
      setMessages((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (teamId) {
          const clamped = {};
          for (const [groupId, list] of Object.entries(next)) {
            clamped[groupId] = Array.isArray(list) ? list.slice(-100) : list;
          }
          setStorage(`workspace_chat_messages_${teamId}`, clamped);
        }
        return next;
      });
    },
    [teamId]
  );

  useEffect(() => {
    setMessages(teamId ? getStorage(`workspace_chat_messages_${teamId}`, {}) : {});
  }, [teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeGroupId, messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setIsSocketLive(false);
      return undefined;
    }

    if (socket.connected) setIsSocketLive(true);
    const onConnect = () => setIsSocketLive(true);
    const onDisconnect = () => setIsSocketLive(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!teamId) return undefined;

    socket.emit('team:join', { teamId }, (res) => {
      if (!res?.ok) return;

      socket.emit('chat:history', { teamId, groupId: activeGroupId, limit: 50 }, (histRes) => {
        if (!histRes?.ok || !histRes.messages) return;

        const formattedMessages = histRes.messages.map((message) => normalizeHistoryMessage(message, activeGroupId));
        persistMessages((prev) => {
          const existing = prev[activeGroupId] || [];
          const serverMessageKeys = new Set(formattedMessages.map((message) => `${message.senderId}_${message.text}`));
          const cleaned = existing.filter((message) => !String(message.id).startsWith('msg-') || !serverMessageKeys.has(`${message.senderId}_${message.text}`));
          const existingIds = new Set(cleaned.map((message) => message._id || message.id));
          return {
            ...prev,
            [activeGroupId]: [...cleaned, ...formattedMessages.filter((message) => !existingIds.has(message._id || message.id))],
          };
        });
      });
    });

    const onChatMessage = (incoming) => {
      if (!incoming || (incoming.teamId && incoming.teamId !== teamId)) return;

      const normalized = normalizeIncomingMessage(incoming, activeGroupId);
      persistMessages((prev) => {
        const current = prev[normalized.groupId] || [];
        if (current.some((message) => message._id === normalized._id || message.id === normalized.id)) return prev;
        const tempIndex = current.findIndex((message) => (
          (!message._id || String(message.id).startsWith('msg-')) &&
          String(message.senderId) === String(normalized.senderId) &&
          message.text === normalized.text
        ));
        const updated = tempIndex !== -1
          ? current.map((message, index) => (index === tempIndex ? normalized : message))
          : [...current, normalized];
        return { ...prev, [normalized.groupId]: updated };
      });
    };

    const onMessageUpdated = (data) => {
      if (!data?.messageId) return;
      persistMessages((prev) => {
        const targetGroup = data.groupId || activeGroupId;
        const updated = (prev[targetGroup] || []).map((message) => (
          message.id === data.messageId || message._id === data.messageId
            ? { ...message, text: data.content, isEdited: true }
            : message
        ));
        return { ...prev, [targetGroup]: updated };
      });
    };

    const onMessageDeleted = (data) => {
      if (!data?.messageId) return;
      persistMessages((prev) => {
        const targetGroup = data.groupId || activeGroupId;
        const updated = (prev[targetGroup] || []).filter((message) => message.id !== data.messageId && message._id !== data.messageId);
        return { ...prev, [targetGroup]: updated };
      });
    };

    const onTyping = (data) => {
      if (!data || data.userId === currentUserId || (data.groupId && data.groupId !== activeGroupId)) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (data.isTyping) next[data.userId] = data.name || 'A teammate';
        else delete next[data.userId];
        return next;
      });
    };

    socket.on('chat:message', onChatMessage);
    socket.on('chat:message_updated', onMessageUpdated);
    socket.on('chat:message_deleted', onMessageDeleted);
    socket.on('chat:typing', onTyping);
    socket.on('chat:group_created', fetchChannels);
    socket.on('chat:group_members_added', fetchChannels);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onChatMessage);
      socket.off('chat:message_updated', onMessageUpdated);
      socket.off('chat:message_deleted', onMessageDeleted);
      socket.off('chat:typing', onTyping);
      socket.off('chat:group_created', fetchChannels);
      socket.off('chat:group_members_added', fetchChannels);
      socket.emit('team:leave', { teamId });
    };
  }, [teamId, activeGroupId, currentUserId, fetchChannels, persistMessages]);

  const activeMessages = dedupeMessages(messages[activeGroupId] || []);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    const isBroadcast = canBroadcast && isSystemBroadcastMode;
    const tempId = `msg-${Date.now()}`;
    const localMessage = {
      id: tempId,
      groupId: activeGroupId,
      senderId: currentUserId,
      senderName: currentUser?.name || 'User',
      senderRole: currentUser?.role || 'Member',
      text: content,
      isSystemBroadcast: isBroadcast,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
    };

    persistMessages((prev) => ({
      ...prev,
      [activeGroupId]: [...(prev[activeGroupId] || []), localMessage],
    }));

    setInputText('');
    setIsSystemBroadcastMode(false);

    const socket = getSocket();
    if (socket && socket.connected && teamId) {
      socket.emit('chat:send', { teamId, groupId: activeGroupId, content, isSystemBroadcast: isBroadcast });
      socket.emit('chat:typing', { teamId, groupId: activeGroupId, isTyping: false });
    }
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
    const socket = getSocket();
    if (socket && socket.connected && teamId) {
      socket.emit('chat:typing', { teamId, groupId: activeGroupId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing', { teamId, groupId: activeGroupId, isTyping: false });
      }, 1500);
    }
  };

  const handleSaveEdit = (messageId) => {
    if (!editingText.trim()) return;
    const text = editingText.trim();
    persistMessages((prev) => {
      const updated = (prev[activeGroupId] || []).map((message) => (
        message.id === messageId || message._id === messageId ? { ...message, text, isEdited: true } : message
      ));
      return { ...prev, [activeGroupId]: updated };
    });
    setEditingMessageId(null);
    setEditingText('');

    const socket = getSocket();
    if (socket && socket.connected && teamId) {
      socket.emit('chat:edit', { teamId, groupId: activeGroupId, messageId, content: text });
    }
  };

  const handleDeleteMessage = (message) => {
    persistMessages((prev) => {
      const updated = (prev[activeGroupId] || []).filter((item) => item.id !== message.id && item._id !== message.id);
      return { ...prev, [activeGroupId]: updated };
    });

    const socket = getSocket();
    if (socket && socket.connected && teamId) {
      socket.emit('chat:delete', { teamId, groupId: activeGroupId, messageId: message._id || message.id });
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  return {
    activeMessages,
    editingMessageId,
    editingText,
    inputText,
    isSocketLive,
    isSystemBroadcastMode,
    messagesEndRef,
    typingUsers,
    handleDeleteMessage,
    handleInputChange,
    handleSaveEdit,
    handleSendMessage,
    handleStartEdit,
    setEditingMessageId,
    setEditingText,
    setIsSystemBroadcastMode,
  };
}
