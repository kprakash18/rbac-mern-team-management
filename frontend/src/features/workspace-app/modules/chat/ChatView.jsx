import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getStorage, setStorage } from '@/lib/storage';
import { getSocket } from '@/lib/socket';
import { useApp } from '@/context/useApp';
import { Modal, Button, Badge, Avatar, SearchInput, ConfirmModal, SanitizedText } from '@/shared/components';


const FALLBACK_GENERAL = {
  id: 'grp-general',
  name: 'general',
  topic: 'Workspace general chat channel',
  memberIds: [],
  isDefault: true,
};

export default function ChatView({ currentUser, workspace }) {
  const { activeWorkspace, hasPermission: hasPermissionContext } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id || '';
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);

  const hasPermission = useCallback(
    (perm) => {
      if (isTeamAdmin || currentUser?.isSuperAdmin) return true;
      if (typeof currentUser?.hasPermission === 'function') return currentUser.hasPermission(perm);
      if (typeof hasPermissionContext === 'function') return hasPermissionContext(perm);
      return (currentUser?.permissions || []).includes(perm);
    },
    [currentUser, hasPermissionContext, isTeamAdmin]
  );

  const canCreateGroup = isTeamAdmin || hasPermission('team.update') || hasPermission('chat.create');
  const canInviteMembers = isTeamAdmin || hasPermission('membership.create') || hasPermission('chat.invite') || hasPermission('team.update');
  const canDeleteGroup = isTeamAdmin || hasPermission('team.update') || hasPermission('chat.delete');
  const canBroadcast = isTeamAdmin || hasPermission('notification.create') || hasPermission('broadcast.create');

  const [teamMembers, setTeamMembers] = useState([]);
  const [groups, setGroups] = useState([FALLBACK_GENERAL]);
  const [activeGroupId, setActiveGroupId] = useState('grp-general');
  const [messages, setMessages] = useState(() =>
    teamId ? getStorage(`workspace_chat_messages_${teamId}`, {}) : {}
  );
  const [inputText, setInputText] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(null);
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSystemBroadcastMode, setIsSystemBroadcastMode] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([currentUserId]);
  const [inviteSelectedIds, setInviteSelectedIds] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!teamId) return;
    api.get(`/api/teams/${teamId}/members`)
      .then((res) => {
        const raw = res.data?.data?.members || res.data?.data || [];
        setTeamMembers(
          raw.map((m) => {
            const u = m.user || m.userId || {};
            const name = u.name || m.name || 'Member';
            const userId = String(u._id || u.id || (typeof m.userId === 'string' ? m.userId : null) || m._id || m.id);
            return {
              id: userId,
              userId,
              membershipId: m._id || m.id,
              name,
              email: u.email || m.email || '',
              role: m.roles?.[0]?.name || m.role?.name || m.role || 'Member',
              teamRole: m.roles?.[0]?.name || m.role?.name || m.role || 'Member',
            };
          })
        );
      })
      .catch((err) => console.error('Failed to load chat team members:', err));
  }, [teamId]);

  const fetchChannels = useCallback(async () => {
    if (!teamId) return;
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
        if (normalized.some((ch) => String(ch._id || ch.id) === prev || ch.id === prev)) return prev;
        const general = normalized.find((ch) => ch.isDefault);
        return general ? String(general._id || general.id) : (normalized[0]?.id || 'grp-general');
      });
    } catch {
      setGroups([FALLBACK_GENERAL]);
    }
  }, [teamId]);

  useEffect(() => {
    fetchChannels();
    const stored = teamId ? getStorage(`workspace_chat_messages_${teamId}`, {}) : {};
    setMessages(stored);
  }, [fetchChannels, teamId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const rawActiveMessages = messages[activeGroupId] || [];

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
      if (String(m.id).startsWith('msg-') && serverMsgKeys.has(`${m.senderId}_${m.text}`)) return false;
      return true;
    });
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeGroupId, messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setIsSocketLive(false);
      return;
    }

    if (socket.connected) setIsSocketLive(true);
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
                text: m.content || m.text,
                isEdited: Boolean(m.isEdited),
                timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
                createdAt: m.createdAt,
              }));

              setMessages((prev) => {
                const existing = prev[activeGroupId] || [];
                const serverMsgKeys = new Set(formattedMsgs.map((f) => `${f.senderId}_${f.text}`));
                const cleaned = existing.filter((e) => !String(e.id).startsWith('msg-') || !serverMsgKeys.has(`${e.senderId}_${e.text}`));
                const existingIds = new Set(cleaned.map((e) => e._id || e.id));
                const next = { ...prev, [activeGroupId]: [...cleaned, ...formattedMsgs.filter((n) => !existingIds.has(n._id || n.id))] };
                if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
                return next;
              });
            }
          });
        }
      });

      const onChatMessage = (incoming) => {
        if (!incoming || (incoming.teamId && incoming.teamId !== teamId)) return;
        const msgId = incoming._id || incoming.id;
        const targetGroup = incoming.groupId || activeGroupId;
        const senderId = incoming.sender?.id || incoming.sender?._id || incoming.senderId;
        const content = incoming.content || incoming.text;

        const normalized = {
          id: msgId,
          _id: msgId,
          groupId: targetGroup,
          senderId,
          senderName: incoming.sender?.name || incoming.senderName || 'Team Member',
          senderRole: incoming.sender?.role || 'Member',
          text: content,
          isEdited: Boolean(incoming.isEdited),
          timestamp: incoming.createdAt ? new Date(incoming.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          createdAt: incoming.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => {
          const current = prev[targetGroup] || [];
          if (current.some((m) => m._id === msgId || m.id === msgId)) return prev;
          const tempIdx = current.findIndex((m) => (!m._id || String(m.id).startsWith('msg-')) && String(m.senderId) === String(senderId) && m.text === content);
          const updated = tempIdx !== -1 ? current.map((m, idx) => (idx === tempIdx ? normalized : m)) : [...current, normalized];
          const next = { ...prev, [targetGroup]: updated };
          if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
          return next;
        });
      };

      const onMessageUpdated = (data) => {
        if (!data?.messageId) return;
        setMessages((prev) => {
          const targetGroup = data.groupId || activeGroupId;
          const updated = (prev[targetGroup] || []).map((m) =>
            m.id === data.messageId || m._id === data.messageId ? { ...m, text: data.content, isEdited: true } : m
          );
          const next = { ...prev, [targetGroup]: updated };
          if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
          return next;
        });
      };

      const onMessageDeleted = (data) => {
        if (!data?.messageId) return;
        setMessages((prev) => {
          const targetGroup = data.groupId || activeGroupId;
          const updated = (prev[targetGroup] || []).filter((m) => m.id !== data.messageId && m._id !== data.messageId);
          const next = { ...prev, [targetGroup]: updated };
          if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
          return next;
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
    }
  }, [teamId, activeGroupId, currentUserId, fetchChannels]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    const isBroadcast = canBroadcast && isSystemBroadcastMode;
    const tempId = `msg-${Date.now()}`;

    const localMsg = {
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

    setMessages((prev) => {
      const next = { ...prev, [activeGroupId]: [...(prev[activeGroupId] || []), localMsg] };
      if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
      return next;
    });

    setInputText('');
    setIsSystemBroadcastMode(false);

    const socket = getSocket();
    if (socket && socket.connected && teamId) {
      socket.emit('chat:send', {
        teamId,
        groupId: activeGroupId,
        content,
        isSystemBroadcast: isBroadcast,
      });
      socket.emit('chat:typing', { teamId, groupId: activeGroupId, isTyping: false });
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
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
    setMessages((prev) => {
      const updated = (prev[activeGroupId] || []).map((m) =>
        m.id === messageId || m._id === messageId ? { ...m, text, isEdited: true } : m
      );
      const next = { ...prev, [activeGroupId]: updated };
      if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
      return next;
    });
    setEditingMessageId(null);
    setEditingText('');

    const socket = getSocket();
    if (socket && socket.connected && teamId) {
      socket.emit('chat:edit', { teamId, groupId: activeGroupId, messageId, content: text });
    }
  };

  const handleDeleteMessage = (msg) => {
    setMessages((prev) => {
      const updated = (prev[activeGroupId] || []).filter((m) => m.id !== msg.id && m._id !== msg.id);
      const next = { ...prev, [activeGroupId]: updated };
      if (teamId) setStorage(`workspace_chat_messages_${teamId}`, next);
      return next;
    });

    const socket = getSocket();
    if (socket && socket.connected && teamId) {
      socket.emit('chat:delete', { teamId, groupId: activeGroupId, messageId: msg._id || msg.id });
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
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
        setGroups((prev) => [...prev, { ...created, id: String(created._id || created.id), memberIds: (created.memberIds || []).map(String) }]);
        setActiveGroupId(String(created._id || created.id));
      }
      setIsCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupTopic('');
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleInviteMembers = async (e) => {
    e.preventDefault();
    if (!inviteSelectedIds.length || !teamId) return;
    try {
      const res = await api.post(`/api/teams/${teamId}/channels/${activeGroupId}/members`, { memberIds: inviteSelectedIds });
      const updated = res.data?.data;
      if (updated) {
        setGroups((prev) =>
          prev.map((g) => (g.id === activeGroupId ? { ...g, memberIds: (updated.memberIds || []).map(String) } : g))
        );
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
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
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
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, memberIds: g.memberIds.filter((id) => id !== currentUserId) } : g))
      );
      setActiveGroupId('grp-general');
      setConfirmLeaveGroup(null);
    } catch (err) {
      console.error('Failed to leave channel:', err);
    }
  };

  const visibleGroups = groups.filter((g) => {
    const isMember = isTeamAdmin || g.isDefault || (g.memberIds || []).includes(currentUserId);
    const matchesSearch = !searchChannel || g.name.toLowerCase().includes(searchChannel.toLowerCase());
    return isMember && matchesSearch;
  });

  const activeGroupMembers = teamMembers.filter((m) =>
    activeGroup?.isDefault ? true : (activeGroup?.memberIds || []).includes(m.id) || (activeGroup?.memberIds || []).includes(m.userId)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col flex-1 h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col md:flex-row rounded-2xl bg-surface-container-lowest border border-border-subtle shadow-sm overflow-hidden">
        <aside className="w-full md:w-64 bg-surface-container-low border-r border-border-subtle flex flex-col justify-between shrink-0">
          <div>
            <div className="p-3 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">forum</span>
                <h2 className="font-label-bold text-on-surface">Channels</h2>
              </div>
              {canCreateGroup && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer"
                  title="Create Channel"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              )}
            </div>

            <div className="p-2 border-b border-border-subtle">
              <SearchInput
                value={searchChannel}
                onChange={(e) => setSearchChannel(e.target.value)}
                onClear={() => setSearchChannel('')}
                placeholder="Search channels..."
                className="w-full"
              />
            </div>

            <div className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-320px)]">
              {visibleGroups.map((g) => {
                const isActive = g.id === activeGroupId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGroupId(g.id)}
                    className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isActive ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[15px] font-mono ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>#</span>
                      <span className="text-[13px] truncate">{g.name}</span>
                    </div>
                    <Badge variant={isActive ? 'primary' : 'neutral'} size="sm">
                      {(g.memberIds || []).length}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-border-subtle flex items-center gap-2">
            <Avatar name={currentUser?.name || 'User'} size="sm" />
            <div className="min-w-0 flex-1">
              <span className="text-[12px] font-semibold text-on-surface block truncate">{currentUser?.name}</span>
              <span className="text-[10px] text-on-surface-variant block truncate">{isTeamAdmin ? ' Team Admin' : currentUser?.role}</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col justify-between bg-surface-container-lowest overflow-hidden">
          <div className="p-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-container-lowest shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-label-bold text-on-surface font-semibold flex items-center gap-1">
                  <span className="font-mono text-on-surface-variant">#</span>
                  <span>{activeGroup.name}</span>
                </h3>
                {activeGroup.isDefault && <Badge variant="outline">Default</Badge>}
                <Badge variant={isSocketLive ? 'success' : 'neutral'}>
                  {isSocketLive ? 'Live' : 'Connecting...'}
                </Badge>
              </div>
              <p className="text-[12px] text-on-surface-variant truncate mt-0.5">{activeGroup.topic}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center -space-x-1.5 mr-1">
                {activeGroupMembers.slice(0, 4).map((m) => (
                  <Avatar key={m.id} name={m.name} size="sm" />
                ))}
              </div>

              {canInviteMembers && (
                <Button size="sm" variant="outline" icon="person_add" onClick={() => setIsInviteModalOpen(true)}>
                  Invite
                </Button>
              )}

              {!activeGroup.isDefault && (
                canDeleteGroup ? (
                  <Button size="sm" variant="danger" icon="delete" onClick={() => setConfirmDeleteGroup(activeGroup)}>
                    Delete
                  </Button>
                ) : (
                  (activeGroup.memberIds || []).includes(currentUserId) && (
                    <Button size="sm" variant="outline" icon="logout" onClick={() => setConfirmLeaveGroup(activeGroup)}>
                      Leave
                    </Button>
                  )
                )
              )}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {activeMessages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const isEditing = editingMessageId === msg.id;

              if (msg.isSystemBroadcast) {
                return (
                  <div key={msg.id} className="w-full my-2 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-amber-950">campaign</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                          SYSTEM BROADCAST
                        </span>
                        <span className="text-[11px] text-amber-800 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-[14px] font-bold text-amber-950">
                        <SanitizedText text={msg.text} />
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`relative group/msg flex items-start gap-2.5 max-w-2xl ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  <Avatar name={msg.senderName} size="sm" />
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-lg`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[12px]">
                      <span className="font-label-bold text-on-surface">{msg.senderName}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{msg.timestamp}</span>
                      {msg.isEdited && <span className="text-[10px] text-on-surface-variant/70 italic">(edited)</span>}
                    </div>

                    {isEditing ? (
                      <div className="w-full min-w-70 p-2.5 rounded-xl bg-surface-container-lowest border-2 border-primary shadow-md flex flex-col gap-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={2}
                          className="w-full bg-transparent text-[13px] text-on-surface outline-none resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => handleSaveEdit(msg.id)}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${isMe ? 'bg-primary text-on-primary rounded-tr-xs' : 'bg-surface-container-low text-on-surface border border-border-subtle rounded-tl-xs'}`}>
                          <SanitizedText text={msg.text} />
                        </div>


                        {(isMe || isTeamAdmin) && (
                          <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity bg-surface-container-lowest border border-border-subtle rounded-lg shadow-sm flex items-center p-0.5 gap-0.5 z-10 ${isMe ? 'right-full mr-1.5' : 'left-full ml-1.5'}`}>
                            {isMe && (
                              <button type="button" onClick={() => { setEditingMessageId(msg.id); setEditingText(msg.text); }} className="p-1 text-on-surface-variant hover:text-primary">
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                            )}
                            <button type="button" onClick={() => handleDeleteMessage(msg)} className="p-1 text-on-surface-variant hover:text-error">
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {Object.keys(typingUsers).length > 0 && (
            <div className="px-4 py-1 text-[11px] text-primary font-medium animate-pulse bg-primary/5">
              {Object.values(typingUsers).join(', ')} typing...
            </div>
          )}

          <form onSubmit={handleSendMessage} className="p-3 border-t border-border-subtle bg-surface-container-lowest shrink-0">
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border ${isSystemBroadcastMode ? 'bg-amber-50 border-amber-400' : 'bg-surface-container-low border-border-subtle'}`}>
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={isSystemBroadcastMode ? 'Type system broadcast...' : `Message #${activeGroup.name}...`}
                className="flex-1 bg-transparent text-[13px] text-on-surface outline-none"
              />

              {canBroadcast && (
                <button
                  type="button"
                  onClick={() => setIsSystemBroadcastMode((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1 cursor-pointer ${isSystemBroadcastMode ? 'bg-amber-300 text-amber-950' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                </button>
              )}

              <Button size="sm" type="submit" disabled={!inputText.trim()} icon="send" />
            </div>
          </form>
        </main>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Channel" subtitle="Create a dedicated channel for team communication">
        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">Channel Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. api-architecture"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none"
            />
          </div>
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">Topic</label>
            <input
              type="text"
              placeholder="What is this channel for?"
              value={newGroupTopic}
              onChange={(e) => setNewGroupTopic(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none"
            />
          </div>
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">Select Members</label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {teamMembers.map((m) => (
                <label key={m.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-surface-container cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedMemberIds((prev) => [...prev, m.id]);
                      else setSelectedMemberIds((prev) => prev.filter((id) => id !== m.id));
                    }}
                    className="rounded text-primary"
                  />
                  <Avatar name={m.name} size="sm" />
                  <span className="text-body-sm text-on-surface">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Channel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite to Channel" subtitle={`Add members to #${activeGroup.name}`}>
        <form onSubmit={handleInviteMembers} className="flex flex-col gap-4">
          <div className="max-h-60 overflow-y-auto space-y-1">
            {teamMembers.map((m) => (
              <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-surface-container cursor-pointer">
                <input
                  type="checkbox"
                  checked={inviteSelectedIds.includes(m.id)}
                  onChange={(e) => {
                    if (e.target.checked) setInviteSelectedIds((prev) => [...prev, m.id]);
                    else setInviteSelectedIds((prev) => prev.filter((id) => id !== m.id));
                  }}
                  className="rounded text-primary"
                />
                <Avatar name={m.name} size="sm" />
                <span className="text-body-sm text-on-surface">{m.name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!inviteSelectedIds.length}>Add Selected</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(confirmDeleteGroup)}
        title={`Delete #${confirmDeleteGroup?.name}?`}
        description="Are you sure you want to delete this channel and its messages?"
        confirmText="Delete Channel"
        confirmVariant="danger"
        icon="delete"
        onConfirm={() => handleDeleteGroup(confirmDeleteGroup)}
        onClose={() => setConfirmDeleteGroup(null)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmLeaveGroup)}
        title={`Leave #${confirmLeaveGroup?.name}?`}
        description="Are you sure you want to leave this channel?"
        confirmText="Leave Channel"
        confirmVariant="warning"
        icon="logout"
        onConfirm={() => handleLeaveGroup(confirmLeaveGroup)}
        onClose={() => setConfirmLeaveGroup(null)}
      />
    </div>
  );
}
