import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

export function useTeamMemberOnboarding({
  isOpen,
  team,
  onClose,
  onOnboardMembers,
  showToast,
}) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedRole, setSelectedRole] = useState('Developer');
  const [userRoleOverrides, setUserRoleOverrides] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [filterTab, setFilterTab] = useState('available');

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoadingUsers(true);
      api.get('/api/users?status=ACTIVE&limit=100')
        .then((res) => {
          if (!isMounted) return;
          const userList = res.data?.data || res.data?.users || [];
          setActiveUsers(userList.filter((user) => (user.accountStatus || user.status || 'ACTIVE').toUpperCase() === 'ACTIVE'));
        })
        .catch((err) => {
          console.error('Failed to load active users for onboarding:', err);
          showToast?.('Failed to load active platform users.', 'error');
        })
        .finally(() => {
          if (isMounted) setLoadingUsers(false);
        });
    } else {
      setSelectedUserIds(new Set());
      setUserRoleOverrides({});
      setSearchQuery('');
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, showToast]);

  const assignedTeamMemberMap = useMemo(() => {
    const map = new Map();
    if (!team || !Array.isArray(team.members)) return map;
    team.members.forEach((member) => {
      const idKey = member.id || member._id;
      if (idKey) map.set(String(idKey), member);
      if (member.email) map.set(member.email.toLowerCase(), member);
    });
    return map;
  }, [team]);

  const categorizedUsers = useMemo(() => activeUsers.map((user) => {
    const userId = String(user._id || user.id);
    const userEmail = (user.email || '').toLowerCase();
    const existingMember = assignedTeamMemberMap.get(userId) || assignedTeamMemberMap.get(userEmail);
    const isAlreadyAssigned = Boolean(existingMember);
    return {
      ...user,
      id: user._id || user.id,
      isAlreadyAssigned,
      currentRoles: existingMember?.roles || (isAlreadyAssigned ? ['Member'] : []),
    };
  }), [activeUsers, assignedTeamMemberMap]);

  const filteredUsers = useMemo(() => categorizedUsers.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query);
    if (!matchesSearch) return false;
    if (filterTab === 'available') return !user.isAlreadyAssigned;
    if (filterTab === 'assigned') return user.isAlreadyAssigned;
    return true;
  }), [categorizedUsers, searchQuery, filterTab]);

  const availableCount = useMemo(() => categorizedUsers.filter((user) => !user.isAlreadyAssigned).length, [categorizedUsers]);
  const assignedCount = useMemo(() => categorizedUsers.filter((user) => user.isAlreadyAssigned).length, [categorizedUsers]);

  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllAvailable = () => {
    const availableUsers = categorizedUsers.filter((user) => !user.isAlreadyAssigned);
    setSelectedUserIds(
      selectedUserIds.size === availableUsers.length && availableUsers.length > 0
        ? new Set()
        : new Set(availableUsers.map((user) => user.id))
    );
  };

  const handleSetUserRole = (userId, roleName) => {
    setUserRoleOverrides((prev) => ({ ...prev, [userId]: roleName }));
  };

  const handleSubmitOnboarding = async (event) => {
    event.preventDefault();
    if (selectedUserIds.size === 0) {
      showToast?.('Please select at least one active user to onboard.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const selectedUsersList = categorizedUsers.filter((user) => selectedUserIds.has(user.id));
      const newMembersToAdd = [];

      for (const user of selectedUsersList) {
        const assignedRoleName = userRoleOverrides[user.id] || selectedRole || 'Developer';
        try {
          await api.post(`/api/teams/${team.id}/members`, {
            userId: user.id,
            roleName: assignedRoleName,
          });
        } catch (apiErr) {
          console.warn(`Could not add user ${user.email} via API:`, apiErr);
        }

        newMembersToAdd.push({
          id: user.id,
          _id: user.id,
          name: user.name,
          email: user.email,
          roles: [assignedRoleName],
          joinedAt: new Date().toISOString(),
        });
      }

      onOnboardMembers?.(team.id, [...(Array.isArray(team.members) ? team.members : []), ...newMembersToAdd]);
      showToast?.(`Successfully onboarded ${newMembersToAdd.length} active member(s) to "${team.name}".`);
      onClose();
    } catch (err) {
      console.error('Failed to onboard members:', err);
      showToast?.(err.response?.data?.message || 'Failed to onboard members to team.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    activeUsers,
    assignedCount,
    availableCount,
    filterTab,
    filteredUsers,
    loadingUsers,
    searchQuery,
    selectedRole,
    selectedUserIds,
    submitting,
    userRoleOverrides,
    handleSelectAllAvailable,
    handleSetUserRole,
    handleSubmitOnboarding,
    handleToggleUser,
    setFilterTab,
    setSearchQuery,
    setSelectedRole,
  };
}
