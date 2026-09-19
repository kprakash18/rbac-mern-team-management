import { useChatChannels } from './useChatChannels';
import { useChatIdentity } from './useChatIdentity';
import { useChatMembers } from './useChatMembers';
import { useChatMessages } from './useChatMessages';

export function useWorkspaceChat({ currentUser, workspace }) {
  const {
    currentUserId,
    isTeamAdmin,
    permissions,
    teamId,
  } = useChatIdentity({ currentUser, workspace });

  const teamMembers = useChatMembers(teamId);
  const channels = useChatChannels({ currentUserId, isTeamAdmin, teamId });
  const messages = useChatMessages({
    activeGroupId: channels.activeGroupId,
    canBroadcast: permissions.canBroadcast,
    currentUser,
    currentUserId,
    fetchChannels: channels.fetchChannels,
    teamId,
  });

  const activeGroupMembers = teamMembers.filter((member) => (
    channels.activeGroup?.isDefault
      ? true
      : (channels.activeGroup?.memberIds || []).includes(member.id) ||
        (channels.activeGroup?.memberIds || []).includes(member.userId)
  ));

  return {
    activeGroup: channels.activeGroup,
    activeGroupId: channels.activeGroupId,
    activeGroupMembers,
    activeMessages: messages.activeMessages,
    confirmDeleteGroup: channels.confirmDeleteGroup,
    confirmLeaveGroup: channels.confirmLeaveGroup,
    currentUserId,
    editingMessageId: messages.editingMessageId,
    editingText: messages.editingText,
    inputText: messages.inputText,
    inviteSelectedIds: channels.inviteSelectedIds,
    isCreateModalOpen: channels.isCreateModalOpen,
    isInviteModalOpen: channels.isInviteModalOpen,
    isSocketLive: messages.isSocketLive,
    isSystemBroadcastMode: messages.isSystemBroadcastMode,
    isTeamAdmin,
    messagesEndRef: messages.messagesEndRef,
    newGroupName: channels.newGroupName,
    newGroupTopic: channels.newGroupTopic,
    permissions,
    searchChannel: channels.searchChannel,
    selectedMemberIds: channels.selectedMemberIds,
    teamMembers,
    typingUsers: messages.typingUsers,
    visibleGroups: channels.visibleGroups,
    handleCreateGroup: channels.handleCreateGroup,
    handleDeleteGroup: channels.handleDeleteGroup,
    handleDeleteMessage: messages.handleDeleteMessage,
    handleInputChange: messages.handleInputChange,
    handleInviteMembers: channels.handleInviteMembers,
    handleLeaveGroup: channels.handleLeaveGroup,
    handleSaveEdit: messages.handleSaveEdit,
    handleSendMessage: messages.handleSendMessage,
    handleStartEdit: messages.handleStartEdit,
    handleToggleCreateMember: channels.handleToggleCreateMember,
    handleToggleInviteMember: channels.handleToggleInviteMember,
    setActiveGroupId: channels.setActiveGroupId,
    setConfirmDeleteGroup: channels.setConfirmDeleteGroup,
    setConfirmLeaveGroup: channels.setConfirmLeaveGroup,
    setEditingMessageId: messages.setEditingMessageId,
    setEditingText: messages.setEditingText,
    setIsCreateModalOpen: channels.setIsCreateModalOpen,
    setIsInviteModalOpen: channels.setIsInviteModalOpen,
    setIsSystemBroadcastMode: messages.setIsSystemBroadcastMode,
    setNewGroupName: channels.setNewGroupName,
    setNewGroupTopic: channels.setNewGroupTopic,
    setSearchChannel: channels.setSearchChannel,
  };
}
