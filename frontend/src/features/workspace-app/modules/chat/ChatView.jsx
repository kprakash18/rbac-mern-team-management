import { useState } from 'react';
import { useApp } from '@/context/useApp';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { useChatEngine } from './useChatEngine';

export default function ChatView({ currentUser, workspace }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;

  const [isSystemBroadcastMode, setIsSystemBroadcastMode] = useState(false);

  const {
    teamMembers,
    groups,
    activeGroupId,
    setActiveGroupId,
    activeGroup,
    activeMessages,
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
    inviteSelectedIds,
    messagesEndRef,
    isTeamAdmin,
    currentUserId,
    handleSendMessage,
    handleTyping,
    handleEditMessage,
    handleDeleteMessage,
    handleOpenCreateModal,
    handleToggleMember,
    handleCreateGroup,
    handleOpenInviteModal,
    handleToggleInviteMember,
    handleInviteMembers,
    handleConfirmDeleteGroup,
    handleConfirmLeaveGroup,
  } = useChatEngine(teamId, currentUser);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    handleTyping();
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = (msgId) => {
    handleEditMessage(msgId, editingText);
  };

  // Filter channels the user has access to
  const visibleGroups = groups.filter((g) => {
    const hasMembership = isTeamAdmin || g.isDefault || g.memberIds.includes(currentUserId);
    const matchesSearch = !searchChannel || g.name.toLowerCase().includes(searchChannel.toLowerCase());
    return hasMembership && matchesSearch;
  });

  const activeGroupMembers = teamMembers.filter((m) => activeGroup?.memberIds?.includes(m.id));
  const availableToInvite = teamMembers.filter((m) => !activeGroup?.memberIds?.includes(m.id));

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-md flex flex-col flex-1 h-[calc(100vh-80px)]">
      {/* Main Split Layout */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm flex flex-1 overflow-hidden">
        {/* Left Panel: Channels & Groups */}
        <aside className="w-64 sm:w-72 border-r border-border-subtle bg-surface-container-low/50 flex flex-col justify-between shrink-0">
          <div>
            {/* Header & New Group Button */}
            <div className="p-3.5 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">forum</span>
                <h2 className="font-headline-md text-[15px] font-bold text-on-surface">Team Chat</h2>
              </div>

              {isTeamAdmin ? (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="p-1 rounded-md text-primary hover:bg-surface-container font-label-bold text-[12px] inline-flex items-center gap-0.5 cursor-pointer"
                  title="Create new chat group"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Group</span>
                </button>
              ) : (
                <span
                  className="p-1 text-on-surface-variant/50 cursor-not-allowed"
                  title="Only Team Admins can create chat groups"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </span>
              )}
            </div>

            {/* Channel Search */}
            <div className="p-2.5 border-b border-border-subtle/70">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchChannel}
                  onChange={(e) => setSearchChannel(e.target.value)}
                  placeholder="Filter groups..."
                  className="w-full pl-8 pr-2.5 py-1 text-[12px] bg-surface-container-lowest border border-border-subtle rounded-lg text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Channels List */}
            <div className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-320px)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-2.5 py-1 block">
                Channels &amp; Groups ({visibleGroups.length})
              </span>

              {visibleGroups.map((group) => {
                const isActive = group.id === activeGroupId;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-primary text-on-primary font-semibold shadow-xs'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[15px] font-mono ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                        #
                      </span>
                      <span className="text-[13px] truncate">{group.name}</span>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                        isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {group.memberIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile Pill at Sidebar Bottom */}
          <div className="p-3 border-t border-border-subtle bg-surface-container-lowest flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                {currentUser?.initials || 'DM'}
              </div>
              <div className="min-w-0">
                <span className="text-[12px] font-semibold text-on-surface block truncate">
                  {currentUser?.name || 'Diana Morales'}
                </span>
                <span className="text-[10px] text-on-surface-variant block truncate">
                  {isTeamAdmin ? '👑 Team Admin' : currentUser?.role || 'Developer'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel: Active Chat Stream */}
        <main className="flex-1 flex flex-col justify-between bg-surface-container-lowest overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-container-lowest/90 backdrop-blur z-10 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-label-bold text-[16px] text-on-surface font-semibold flex items-center gap-1">
                  <span className="font-mono text-on-surface-variant text-[16px]">#</span>
                  <span>{activeGroup.name}</span>
                </h3>

                {activeGroup.isDefault && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-container-high text-on-surface-variant font-medium">
                    Default
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isSocketLive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSocketLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  ></span>
                  <span>{isSocketLive ? 'Live WebSocket' : 'Connecting...'}</span>
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant truncate mt-0.5">{activeGroup.topic}</p>
            </div>

            {/* Member List & Admin Invite Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Member Avatars Stack */}
              <div className="flex items-center -space-x-1.5 mr-1" title={`${activeGroupMembers.length} members in this channel`}>
                {activeGroupMembers.slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    className="w-6 h-6 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center font-bold text-[9px] text-on-surface"
                    title={`${member.name} (${member.teamRole})`}
                  >
                    {member.initials}
                  </div>
                ))}
                {activeGroupMembers.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-surface-container border-2 border-surface-container-lowest flex items-center justify-center text-[9px] text-on-surface-variant font-medium">
                    +{activeGroupMembers.length - 4}
                  </div>
                )}
              </div>

              {/* Invite Member Button (Admin Only) */}
              {isTeamAdmin ? (
                <button
                  type="button"
                  onClick={handleOpenInviteModal}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container border border-border-subtle text-[12px] font-semibold text-on-surface transition-colors cursor-pointer"
                  title="Invite teammates to this group"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                  <span>Invite</span>
                </button>
              ) : (
                <div
                  className="px-2.5 py-1 rounded-lg bg-surface-container-low text-[12px] text-on-surface-variant opacity-60 border border-border-subtle cursor-not-allowed"
                  title="Only Team Admins can invite members to groups"
                >
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">lock</span>
                  <span>{activeGroupMembers.length} Members</span>
                </div>
              )}

              {/* Channel Actions: Delete (Admin) or Leave (Member) if not default channel */}
              {!activeGroup.isDefault && (
                <>
                  {isTeamAdmin ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteGroup(activeGroup)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-error-container/40 hover:text-error border border-border-subtle text-[12px] font-semibold text-on-surface-variant transition-colors cursor-pointer"
                      title="Delete this channel and all its messages"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span className="hidden sm:inline">Delete Channel</span>
                    </button>
                  ) : (
                    activeGroup.memberIds.includes(currentUserId) && (
                      <button
                        type="button"
                        onClick={() => setConfirmLeaveGroup(activeGroup)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container border border-border-subtle text-[12px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                        title="Leave this channel"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        <span className="hidden sm:inline">Leave</span>
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {activeMessages.map((msg) => {
              const isMe = msg.senderId === currentUserId;

              if (msg.isSystemBroadcast) {
                return (
                  <div
                    key={msg.id}
                    className="w-full my-2 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex items-start gap-3 animate-in fade-in"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-950 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">campaign</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                          SYSTEM BROADCAST • ALL USERS
                        </span>
                        <span className="text-[11px] text-amber-800 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-[14px] font-bold text-amber-950 leading-snug">{msg.text}</p>
                      <span className="text-[11px] text-amber-800 mt-1 block">
                        Broadcast by {msg.senderName} ({msg.senderRole})
                      </span>
                    </div>
                  </div>
                );
              }

              const canEdit = isMe && !msg.isSystemBroadcast;
              const canDelete = (isMe || isTeamAdmin) && !msg.isSystemBroadcast;
              const isEditing = editingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`relative group/msg flex items-start gap-2.5 max-w-2xl ${
                    isMe ? 'self-end flex-row-reverse' : 'self-start'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      isMe ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {msg.senderInitials}
                  </div>

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-lg`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-label-bold text-[12px] text-on-surface">
                        {msg.senderName} {isMe && '(You)'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{msg.timestamp}</span>
                      {msg.isEdited && (
                        <span className="text-[10px] text-on-surface-variant/70 italic font-mono">
                          (edited)
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="w-full min-w-70 p-2.5 rounded-xl bg-surface-container-lowest border-2 border-primary shadow-md flex flex-col gap-2 animate-in zoom-in-95 duration-100">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(msg.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          rows={2}
                          className="w-full bg-transparent text-[13px] text-on-surface outline-none resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-border-subtle">
                          <span className="text-[10px]">
                            esc to <button type="button" onClick={handleCancelEdit} className="text-primary hover:underline">cancel</button> • enter to <button type="button" onClick={() => handleSaveEdit(msg.id)} className="text-primary hover:underline font-bold">save</button>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-2 py-0.5 rounded border border-border-subtle hover:bg-surface-container text-on-surface text-[11px] font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-2.5 py-0.5 rounded bg-primary text-on-primary hover:opacity-90 text-[11px] font-bold cursor-pointer shadow-xs"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-primary text-on-primary rounded-tr-xs'
                              : 'bg-surface-container-low text-on-surface border border-border-subtle rounded-tl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Hover Action Menu */}
                        {(canEdit || canDelete) && (
                          <div
                            className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity bg-surface-container-lowest border border-border-subtle rounded-lg shadow-sm flex items-center p-0.5 gap-0.5 z-10 ${
                              isMe ? 'right-full mr-1.5' : 'left-full ml-1.5'
                            }`}
                          >
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                title="Edit message"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeletingMessage(msg)}
                                className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                                title={isMe ? 'Delete message' : 'Delete message (Team Admin)'}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            )}
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

          {/* Typing Indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="px-4 py-1 flex items-center gap-1.5 text-[11px] text-primary font-medium animate-pulse bg-primary/5 border-t border-border-subtle/50">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              <span>
                {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}

          {/* Message Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border-subtle bg-surface-container-lowest shrink-0">
            {isSystemBroadcastMode && (
              <div className="mb-2 px-3 py-1 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-between text-[11px] text-amber-900 font-semibold animate-in fade-in">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">campaign</span>
                  <span>BROADCASTING SYSTEM MESSAGE TO ALL USERS ON THE GO</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSystemBroadcastMode(false)}
                  className="text-amber-800 hover:text-amber-950 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors ${
              isSystemBroadcastMode
                ? 'bg-amber-50 border-2 border-amber-400'
                : 'bg-surface-container-low border border-border-subtle focus-within:border-primary focus-within:bg-surface-container-lowest'
            }`}>
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={
                  isSystemBroadcastMode
                    ? 'Type system broadcast to all users (e.g. "Today is deployment day hope everyone is ready")...'
                    : `Message #${activeGroup.name}...`
                }
                className="flex-1 bg-transparent text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant"
              />

              {isTeamAdmin && (
                <button
                  type="button"
                  onClick={() => setIsSystemBroadcastMode((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                    isSystemBroadcastMode
                      ? 'bg-amber-300 text-amber-950 shadow-xs'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                  title={isSystemBroadcastMode ? 'Exit broadcast mode' : 'Broadcast system message to all users on the go'}
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  <span className="hidden sm:inline">Broadcast</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-1.5 rounded-lg text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center justify-center shrink-0 ${
                  isSystemBroadcastMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary'
                }`}
                title="Send Message (Enter)"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Modal 1: Create New Chat Group (Team Admin Only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-md border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Create Chat Group
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  Create a dedicated channel and invite members from Acme Engineering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-md flex flex-col gap-3.5">
              {/* Group Name */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Channel Name *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-on-surface-variant font-mono text-[14px]">#</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. api-architecture, client-onboarding"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Topic / Description */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Topic &amp; Purpose
                </label>
                <input
                  type="text"
                  placeholder="What is this channel for?"
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Invite Members Multi-select Checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-label-sm font-label-bold text-on-surface">
                    Invite Team Members ({selectedMemberIds.length} selected)
                  </label>
                  <span className="text-[11px] text-primary font-medium">Team Admin privilege</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-border-subtle rounded-xl divide-y divide-border-subtle bg-surface-container-low">
                  {teamMembers.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    const isCreator = member.id === currentUserId;

                    return (
                      <div
                        key={member.id}
                        onClick={() => !isCreator && handleToggleMember(member.id)}
                        className={`p-2.5 flex items-center justify-between transition-colors ${
                          isCreator ? 'bg-surface-container/60 cursor-default' : 'hover:bg-surface-container cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isCreator}
                            onChange={() => !isCreator && handleToggleMember(member.id)}
                            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                          />
                          <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface shrink-0">
                            {member.initials}
                          </div>
                          <div>
                            <span className="text-[12px] font-semibold text-on-surface block">
                              {member.name} {isCreator && '(You - Admin)'}
                            </span>
                            <span className="text-[10px] text-on-surface-variant block">
                              {member.role} • {member.teamRole}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                            Invited
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity shadow-sm cursor-pointer"
                >
                  Create &amp; Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Invite Teammates to Existing Channel (Team Admin Only) */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-md border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Invite to #{activeGroup.name}
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  Add available team members to this conversation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleInviteMembers} className="p-md flex flex-col gap-3.5">
              {availableToInvite.length === 0 ? (
                <div className="py-6 text-center text-on-surface-variant text-[13px]">
                  All team members have already been added to #{activeGroup.name}!
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-border-subtle rounded-xl divide-y divide-border-subtle bg-surface-container-low">
                  {availableToInvite.map((member) => {
                    const isChecked = inviteSelectedIds.includes(member.id);

                    return (
                      <div
                        key={member.id}
                        onClick={() => handleToggleInviteMember(member.id)}
                        className="p-2.5 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleInviteMember(member.id)}
                            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                          />
                          <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface shrink-0">
                            {member.initials}
                          </div>
                          <div>
                            <span className="text-[12px] font-semibold text-on-surface block">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-on-surface-variant block">
                              {member.role}
                            </span>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                            Selected
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSelectedIds.length === 0}
                  className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity shadow-sm cursor-pointer disabled:opacity-40"
                >
                  Add Members ({inviteSelectedIds.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingMessage)}
        title="Delete Message?"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="delete"
        onConfirm={() => handleDeleteMessage(deletingMessage.id)}
        onClose={() => setDeletingMessage(null)}
      >
        {deletingMessage && (
          <div className="p-2 rounded-lg bg-surface-container-low text-[12px] text-on-surface-variant italic truncate max-w-60 mt-1">
            "{deletingMessage.text}"
          </div>
        )}
      </ConfirmModal>

      {/* Delete Channel Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteGroup)}
        title={`Delete #${confirmDeleteGroup?.name}?`}
        description="Are you sure you want to delete this channel? All chat history and messages in this channel will be permanently removed for all members."
        confirmText="Delete Channel"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="delete_forever"
        onConfirm={handleConfirmDeleteGroup}
        onClose={() => setConfirmDeleteGroup(null)}
      />

      {/* Leave Channel Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmLeaveGroup)}
        title={`Leave #${confirmLeaveGroup?.name}?`}
        description="You will no longer receive updates or have access to messages in this channel unless invited back by an admin."
        confirmText="Leave Channel"
        cancelText="Cancel"
        confirmVariant="primary"
        icon="logout"
        onConfirm={handleConfirmLeaveGroup}
        onClose={() => setConfirmLeaveGroup(null)}
      />
    </div>
  );
}
