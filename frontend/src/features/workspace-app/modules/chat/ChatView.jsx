import { memo } from 'react';
import ChatChannelModals from './components/ChatChannelModals';
import ChatComposer from './components/ChatComposer';
import ChatHeader from './components/ChatHeader';
import ChatMessageList from './components/ChatMessageList';
import ChatSidebar from './components/ChatSidebar';
import { useWorkspaceChat } from './hooks/useWorkspaceChat';

function ChatView({ currentUser, workspace }) {
  const chat = useWorkspaceChat({ currentUser, workspace });
  const {
    activeGroup,
    activeGroupId,
    activeGroupMembers,
    activeMessages,
    confirmDeleteGroup,
    confirmLeaveGroup,
    currentUserId,
    editingMessageId,
    editingText,
    inputText,
    inviteSelectedIds,
    isCreateModalOpen,
    isInviteModalOpen,
    isSocketLive,
    isSystemBroadcastMode,
    isTeamAdmin,
    messagesEndRef,
    newGroupName,
    newGroupTopic,
    permissions,
    searchChannel,
    selectedMemberIds,
    teamMembers,
    typingUsers,
    visibleGroups,
    handleCreateGroup,
    handleDeleteGroup,
    handleDeleteMessage,
    handleInputChange,
    handleInviteMembers,
    handleLeaveGroup,
    handleSaveEdit,
    handleSendMessage,
    handleStartEdit,
    handleToggleCreateMember,
    handleToggleInviteMember,
    setActiveGroupId,
    setConfirmDeleteGroup,
    setConfirmLeaveGroup,
    setEditingMessageId,
    setEditingText,
    setIsCreateModalOpen,
    setIsInviteModalOpen,
    setIsSystemBroadcastMode,
    setNewGroupName,
    setNewGroupTopic,
    setSearchChannel,
  } = chat;

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col flex-1 h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col md:flex-row rounded-2xl bg-surface-container-lowest border border-border-subtle shadow-sm overflow-hidden">
        <ChatSidebar
          activeChannelId={activeGroupId}
          canCreateChannel={permissions.canCreateGroup}
          channels={visibleGroups}
          currentUser={currentUser}
          isTeamAdmin={isTeamAdmin}
          onClearSearch={() => setSearchChannel('')}
          onCreateChannel={() => setIsCreateModalOpen(true)}
          onSearchChange={(event) => setSearchChannel(event.target.value)}
          onSelectChannel={setActiveGroupId}
          searchValue={searchChannel}
        />

        <main className="flex-1 flex flex-col justify-between bg-surface-container-lowest overflow-hidden">
          <ChatHeader
            activeChannel={activeGroup}
            activeMembers={activeGroupMembers}
            canDeleteChannel={permissions.canDeleteGroup}
            canInviteMembers={permissions.canInviteMembers}
            currentUserId={currentUserId}
            isSocketLive={isSocketLive}
            onDelete={setConfirmDeleteGroup}
            onInvite={() => setIsInviteModalOpen(true)}
            onLeave={setConfirmLeaveGroup}
          />

          <ChatMessageList
            canModerate={isTeamAdmin}
            currentUserId={currentUserId}
            editingMessageId={editingMessageId}
            editingText={editingText}
            messages={activeMessages}
            messagesEndRef={messagesEndRef}
            onCancelEdit={() => setEditingMessageId(null)}
            onDelete={handleDeleteMessage}
            onEditingTextChange={(event) => setEditingText(event.target.value)}
            onSaveEdit={handleSaveEdit}
            onStartEdit={handleStartEdit}
          />

          {Object.keys(typingUsers).length > 0 && (
            <div className="px-4 py-1 text-[11px] text-primary font-medium animate-pulse bg-primary/5">
              {Object.values(typingUsers).join(', ')} typing...
            </div>
          )}

          <ChatComposer
            canBroadcast={permissions.canBroadcast}
            channelName={activeGroup.name}
            inputText={inputText}
            isBroadcastMode={isSystemBroadcastMode}
            onChange={handleInputChange}
            onSubmit={handleSendMessage}
            onToggleBroadcast={() => setIsSystemBroadcastMode((prev) => !prev)}
          />
        </main>
      </div>

      <ChatChannelModals
        activeChannel={activeGroup}
        confirmDeleteChannel={confirmDeleteGroup}
        confirmLeaveChannel={confirmLeaveGroup}
        createForm={{
          name: newGroupName,
          onNameChange: (event) => setNewGroupName(event.target.value),
          onTopicChange: (event) => setNewGroupTopic(event.target.value),
          selectedMemberIds,
          topic: newGroupTopic,
        }}
        inviteForm={{ selectedIds: inviteSelectedIds }}
        isCreateOpen={isCreateModalOpen}
        isInviteOpen={isInviteModalOpen}
        members={teamMembers}
        onCloseCreate={() => setIsCreateModalOpen(false)}
        onCloseDelete={() => setConfirmDeleteGroup(null)}
        onCloseInvite={() => setIsInviteModalOpen(false)}
        onCloseLeave={() => setConfirmLeaveGroup(null)}
        onConfirmDelete={handleDeleteGroup}
        onConfirmLeave={handleLeaveGroup}
        onCreateSubmit={handleCreateGroup}
        onInviteSubmit={handleInviteMembers}
        onToggleCreateMember={handleToggleCreateMember}
        onToggleInviteMember={handleToggleInviteMember}
      />
    </div>
  );
}

export default memo(ChatView);
