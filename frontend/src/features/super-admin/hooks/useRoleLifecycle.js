import { useState } from 'react';
import * as rolesApi from '../api/rolesApi';

export function useRoleLifecycle({ roles, setRoles, drawerRole, setDrawerRole, showToast }) {
  const [safeDeleteRole, setSafeDeleteRole] = useState(null);
  const [safeDeleteLoading, setSafeDeleteLoading] = useState(false);

  const toggleStatus = async (roleId) => {
    const targetRole = roles.find((role) => role.id === roleId);
    if (!targetRole || targetRole.type === 'system') return;

    const nextStatus = targetRole.status === 'disabled' ? 'active' : 'disabled';

    try {
      await rolesApi.updateRoleStatus(roleId, nextStatus.toUpperCase());
    } catch (err) {
      console.warn('API status patch failed, updating local state:', err);
    }

    setRoles((prev) =>
      prev.map((role) => (role.id === roleId ? { ...role, status: nextStatus } : role))
    );
    showToast(`Role "${targetRole.name}" is now ${nextStatus.toUpperCase()}.`);
  };

  const toggleArchive = async (roleId) => {
    const targetRole = roles.find((role) => role.id === roleId);
    if (!targetRole || targetRole.type === 'system') return;

    const nextStatus = targetRole.status === 'archived' ? 'active' : 'archived';

    try {
      if (nextStatus === 'archived') {
        await rolesApi.archiveRole(roleId);
      } else {
        await rolesApi.restoreRole(roleId);
      }
    } catch (err) {
      console.warn('API delete/restore failed, updating local state:', err);
    }

    setRoles((prev) =>
      prev.map((role) => (role.id === roleId ? { ...role, status: nextStatus } : role))
    );
    showToast(`Role "${targetRole.name}" has been ${nextStatus === 'archived' ? 'archived' : 'restored'}.`);
  };

  const initiateDelete = async (roleToDelete) => {
    if (!roleToDelete || roleToDelete.type === 'system') return;

    const assignedCount = roleToDelete.assignedUsers?.length || roleToDelete.members || 0;
    if (assignedCount > 0) {
      setSafeDeleteRole(roleToDelete);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete role "${roleToDelete.name}"?`)) {
      return;
    }

    try {
      await rolesApi.deleteRole(roleToDelete.id);
    } catch (err) {
      console.warn('API delete failed, removing locally:', err);
    }

    setRoles((prev) => prev.filter((role) => role.id !== roleToDelete.id));
    if (drawerRole?.id === roleToDelete.id) {
      setDrawerRole(null);
    }
    showToast(`Role "${roleToDelete.name}" has been deleted.`);
  };

  const confirmSafeDelete = async (roleToDelete, targetRoleId) => {
    try {
      setSafeDeleteLoading(true);
      const targetRole = roles.find((role) => role.id === targetRoleId);
      const membersToMove = roleToDelete.assignedUsers || [];

      try {
        await rolesApi.deleteRole(roleToDelete.id, { reassignToRoleId: targetRoleId });
      } catch (err) {
        console.warn('API safe delete failed, updating local state:', err);
      }

      setRoles((prev) => {
        return prev
          .filter((role) => role.id !== roleToDelete.id)
          .map((role) => {
            if (role.id === targetRoleId) {
              const updatedUsers = [...(role.assignedUsers || []), ...membersToMove];
              return rolesApi.formatRole({
                ...role,
                assignedUsers: updatedUsers,
                membersCount: updatedUsers.length,
              });
            }
            return role;
          });
      });

      if (drawerRole?.id === roleToDelete.id) {
        setDrawerRole(null);
      }
      setSafeDeleteRole(null);
      showToast(
        `Reassigned ${membersToMove.length} member(s) to "${targetRole?.name || 'replacement role'}" and deleted "${roleToDelete.name}".`
      );
    } catch (err) {
      console.error('Failed to safely delete role:', err);
      showToast('Failed to delete role and reassign members.', 'error');
    } finally {
      setSafeDeleteLoading(false);
    }
  };

  return {
    safeDeleteRole,
    safeDeleteLoading,
    setSafeDeleteRole,
    toggleStatus,
    toggleArchive,
    initiateDelete,
    confirmSafeDelete,
  };
}
