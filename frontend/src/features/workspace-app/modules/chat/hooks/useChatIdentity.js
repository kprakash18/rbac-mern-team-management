import { useCallback } from 'react';
import { useApp } from '@/context/useApp';

export function useChatIdentity({ currentUser, workspace }) {
  const { activeWorkspace, hasPermission: hasPermissionContext } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id || '';
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);

  const hasPermission = useCallback(
    (permission) => {
      if (isTeamAdmin || currentUser?.isSuperAdmin) return true;
      if (typeof currentUser?.hasPermission === 'function') return currentUser.hasPermission(permission);
      if (typeof hasPermissionContext === 'function') return hasPermissionContext(permission);
      return (currentUser?.permissions || []).includes(permission);
    },
    [currentUser, hasPermissionContext, isTeamAdmin]
  );

  return {
    currentUserId,
    isTeamAdmin,
    permissions: {
      canBroadcast: isTeamAdmin || hasPermission('notification.create') || hasPermission('broadcast.create'),
      canCreateGroup: isTeamAdmin || hasPermission('team.update') || hasPermission('chat.create'),
      canDeleteGroup: isTeamAdmin || hasPermission('team.update') || hasPermission('chat.delete'),
      canInviteMembers: isTeamAdmin || hasPermission('membership.create') || hasPermission('chat.invite') || hasPermission('team.update'),
    },
    teamId,
  };
}
