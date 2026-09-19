import { useCallback, useMemo, useState } from 'react';
import {
  addTeamMember,
  createTeam,
  getActivePlatformUsers,
  updateTeam,
} from '../api/teamsApi.js';

const initialTeamForm = {
  name: '',
  description: '',
  icon: 'engineering',
  status: 'ACTIVE',
};

export function useTeamWorkspaceEditor({ availableRoles, onSaved, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [teamForm, setTeamForm] = useState(initialTeamForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [activePlatformUsers, setActivePlatformUsers] = useState([]);
  const [loadingPlatformUsers, setLoadingPlatformUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [roleOverrides, setRoleOverrides] = useState({});
  const [defaultRole, setDefaultRole] = useState('Developer');
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [memberSearch, setMemberSearch] = useState('');

  const fetchActivePlatformUsers = async () => {
    try {
      setLoadingPlatformUsers(true);
      const users = await getActivePlatformUsers();
      setActivePlatformUsers(users);
    } catch (err) {
      console.warn('Could not load active users:', err);
    } finally {
      setLoadingPlatformUsers(false);
    }
  };

  const openCreateModal = useCallback(() => {
    setEditingTeam(null);
    setActiveTab('general');
    setTeamForm(initialTeamForm);
    setSelectedUsers(new Set());
    setRoleOverrides({});
    setDefaultRole('Developer');
    setMemberSearch('');
    setSelectedRoles(new Set(availableRoles.map((role) => role.name || role.id)));
    setIsOpen(true);
    fetchActivePlatformUsers();
  }, [availableRoles]);

  const openEditModal = (team) => {
    setEditingTeam(team);
    setActiveTab('general');
    setTeamForm({
      name: team.name,
      description: team.description || '',
      icon: team.icon || 'engineering',
      status: team.status === 'Archived' ? 'ARCHIVED' : 'ACTIVE',
    });
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const updateTeamForm = (updates) => {
    setTeamForm((prev) => ({ ...prev, ...updates }));
  };

  const toggleCreateRole = (roleIdentifier) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleIdentifier)) {
        if (next.size > 1) {
          next.delete(roleIdentifier);
        } else {
          showToast('At least one role must be enabled for the team workspace.', 'warning');
          return prev;
        }
      } else {
        next.add(roleIdentifier);
      }
      return next;
    });
  };

  const selectAllCreateRoles = () => {
    if (selectedRoles.size === availableRoles.length && availableRoles.length > 0) {
      const fallbackRole = availableRoles[0]?.name || 'Developer';
      setSelectedRoles(new Set([fallbackRole]));
    } else {
      setSelectedRoles(new Set(availableRoles.map((role) => role.name || role.id)));
    }
  };

  const enabledRolesForCreate = useMemo(() => {
    const list = availableRoles.filter((role) =>
      selectedRoles.has(role.name) || selectedRoles.has(role.id) || selectedRoles.has(role._id)
    );
    return list.length > 0 ? list : availableRoles;
  }, [availableRoles, selectedRoles]);

  const toggleCreateUser = (userId) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const selectAllCreateUsers = () => {
    if (selectedUsers.size === activePlatformUsers.length && activePlatformUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(activePlatformUsers.map((user) => user._id || user.id)));
    }
  };

  const setRoleOverride = (userId, role) => {
    setRoleOverrides((prev) => ({ ...prev, [userId]: role }));
  };

  const saveTeam = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (!teamForm.name.trim()) {
      showToast('Please enter a team name.', 'warning');
      setActiveTab('general');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingTeam) {
        await updateTeam(editingTeam.id, {
          name: teamForm.name.trim(),
          description: teamForm.description.trim(),
          status: teamForm.status,
        });
        showToast(`Team "${teamForm.name}" updated successfully.`);
      } else {
        const newTeam = await createTeam({
          name: teamForm.name.trim(),
          description: teamForm.description.trim(),
        });
        const newTeamId = newTeam?._id || newTeam?.id;

        if (newTeamId && selectedUsers.size > 0) {
          const selectedList = activePlatformUsers.filter((user) =>
            selectedUsers.has(user._id || user.id)
          );

          for (const user of selectedList) {
            const uid = user._id || user.id;
            const roleToAssign = roleOverrides[uid] || defaultRole || 'Developer';
            try {
              await addTeamMember(newTeamId, {
                userId: uid,
                roleName: roleToAssign,
              });
            } catch (memberErr) {
              console.warn(`Failed adding member ${user.email} to team:`, memberErr);
            }
          }
        }

        const memberMsg =
          selectedUsers.size > 0
            ? ` and onboarded ${selectedUsers.size} active member(s)`
            : '';
        showToast(`Team "${teamForm.name}" created${memberMsg} successfully.`);
      }
      setIsOpen(false);
      onSaved();
    } catch (err) {
      console.error('Failed to save team:', err);
      showToast(err.response?.data?.message || 'Failed to save team.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return {
    isOpen,
    editingTeam,
    setEditingTeam,
    activeTab,
    setActiveTab,
    teamForm,
    updateTeamForm,
    formSubmitting,
    activePlatformUsers,
    loadingPlatformUsers,
    selectedUsers,
    roleOverrides,
    defaultRole,
    setDefaultRole,
    selectedRoles,
    memberSearch,
    setMemberSearch,
    enabledRolesForCreate,
    openCreateModal,
    openEditModal,
    closeModal,
    toggleCreateRole,
    selectAllCreateRoles,
    toggleCreateUser,
    selectAllCreateUsers,
    setRoleOverride,
    saveTeam,
  };
}
