import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useToast } from '@/lib/useToast.js';

export function useTeamsManagement({ createTrigger }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [modalTab, setModalTab] = useState('general'); // 'general' | 'roles' | 'members'
  const [teamForm, setTeamForm] = useState({ name: '', description: '', icon: 'engineering', status: 'ACTIVE' });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Creation-specific roles & members state
  const [activePlatformUsers, setActivePlatformUsers] = useState([]);
  const [loadingPlatformUsers, setLoadingPlatformUsers] = useState(false);
  const [createSelectedUsers, setCreateSelectedUsers] = useState(new Set());
  const [createRoleOverrides, setCreateRoleOverrides] = useState({});
  const [createDefaultRole, setCreateDefaultRole] = useState('Developer');
  const [createSelectedRoles, setCreateSelectedRoles] = useState(new Set());
  const [createMemberSearch, setCreateMemberSearch] = useState('');

  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);
  const [selectedTeamForRoles, setSelectedTeamForRoles] = useState(null);
  const [teamForOnboarding, setTeamForOnboarding] = useState(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Role Removal Safeguard State
  const [roleRemovalData, setRoleRemovalData] = useState(null); // { team, member, roleToRemove, replacementRoleId }
  const [roleRemovalLoading, setRoleRemovalLoading] = useState(false);

  const [toast, showToast] = useToast(3500);

  // Fetch teams & available roles from backend API
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsRes, rolesRes] = await Promise.allSettled([
        api.get('/api/teams?status=all'),
        api.get('/api/roles?status=all'),
      ]);

      if (rolesRes.status === 'fulfilled' && rolesRes.value.data?.data) {
        setAvailableRoles(rolesRes.value.data.data);
      }

      const rawTeams = teamsRes.status === 'fulfilled' ? (teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || []) : [];

      if (Array.isArray(rawTeams)) {
        const formatted = rawTeams.map((t) => {
          const id = t._id || t.id;
          const status = (t.status || 'ACTIVE').toUpperCase();
          const nameLower = (t.name || '').toLowerCase();
          const autoIcon = nameLower.includes('sec')
            ? 'security'
            : nameLower.includes('devops') || nameLower.includes('cloud') || nameLower.includes('infra')
            ? 'cloud'
            : nameLower.includes('data') || nameLower.includes('ai') || nameLower.includes('lab')
            ? 'dataset'
            : nameLower.includes('product') || nameLower.includes('design')
            ? 'palette'
            : nameLower.includes('support') || nameLower.includes('operat') || nameLower.includes('customer')
            ? 'support_agent'
            : nameLower.includes('finance')
            ? 'payments'
            : nameLower.includes('marketing')
            ? 'campaign'
            : 'engineering';

          const memberList = Array.isArray(t.members)
            ? t.members.map((m) => ({
                ...m,
                id: m.id || m._id || m.email,
                roles: Array.isArray(m.roles) && m.roles.length > 0 ? m.roles : ['Member'],
              }))
            : [];

          return {
            id,
            _id: id,
            name: t.name,
            description: t.description || 'Organizational team workspace.',
            status: status === 'ACTIVE' ? 'Active' : status === 'ARCHIVED' ? 'Archived' : status,
            statusType: status === 'ACTIVE' ? 'active' : 'archived',
            membersCount: t.membersCount ?? (memberList.length > 0 ? memberList.length : 1),
            admins: Array.isArray(t.admins) && t.admins.length > 0 ? t.admins : (t.createdBy?.name ? [t.createdBy.name] : ['Team Admin']),
            members: memberList,
            createdBy: t.createdBy,
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
            icon: t.icon || autoIcon,
          };
        });
        setTeams(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch teams:', err);
      showToast('Could not load teams list from backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filterTabs = ['All', 'Active', 'Archived'];

  const handleFilterChange = (tab) => {
    setActiveFilter(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        team.name.toLowerCase().includes(q) ||
        (team.description && team.description.toLowerCase().includes(q));

      const matchesFilter =
        activeFilter === 'All' ||
        team.status.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [teams, searchQuery, activeFilter]);

  const totalItems = filteredTeams.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);
  const paginatedTeams = filteredTeams.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // Fetch active platform users for member onboarding
  const fetchActivePlatformUsers = useCallback(async () => {
    try {
      setLoadingPlatformUsers(true);
      const res = await api.get('/api/users?status=ACTIVE&limit=100');
      const userList = res.data?.data || res.data?.users || [];
      const activeOnly = userList.filter(
        (u) => (u.accountStatus || u.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
      );
      setActivePlatformUsers(activeOnly);
    } catch (err) {
      console.warn('Could not load active users:', err);
    } finally {
      setLoadingPlatformUsers(false);
    }
  }, []);

  // Modal Handlers
  const handleOpenCreateModal = useCallback(() => {
    setEditingTeam(null);
    setModalTab('general');
    setTeamForm({ name: '', description: '', icon: 'engineering', status: 'ACTIVE' });
    setCreateSelectedUsers(new Set());
    setCreateRoleOverrides({});
    setCreateDefaultRole('Developer');
    setCreateMemberSearch('');
    // Pre-select all available standard roles for the team workspace
    setCreateSelectedRoles(new Set(availableRoles.map((r) => r.name || r.id)));
    setIsCreateModalOpen(true);
    fetchActivePlatformUsers();
  }, [availableRoles, fetchActivePlatformUsers]);

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreateModal();
    }
  }, [createTrigger, handleOpenCreateModal]);

  const handleOpenEditModal = (team) => {
    setEditingTeam(team);
    setModalTab('general');
    setTeamForm({
      name: team.name,
      description: team.description || '',
      icon: team.icon || 'engineering',
      status: team.status === 'Archived' ? 'ARCHIVED' : 'ACTIVE',
    });
    setIsCreateModalOpen(true);
  };

  const handleToggleCreateRole = (roleIdentifier) => {
    setCreateSelectedRoles((prev) => {
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

  const handleSelectAllCreateRoles = () => {
    if (createSelectedRoles.size === availableRoles.length && availableRoles.length > 0) {
      const defaultRole = availableRoles[0]?.name || 'Developer';
      setCreateSelectedRoles(new Set([defaultRole]));
    } else {
      setCreateSelectedRoles(new Set(availableRoles.map((r) => r.name || r.id)));
    }
  };

  // Filtered available roles for this new team
  const enabledRolesForCreate = useMemo(() => {
    const list = availableRoles.filter((r) =>
      createSelectedRoles.has(r.name) || createSelectedRoles.has(r.id) || createSelectedRoles.has(r._id)
    );
    return list.length > 0 ? list : availableRoles;
  }, [availableRoles, createSelectedRoles]);

  const handleToggleCreateUser = (userId) => {
    setCreateSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAllCreateUsers = () => {
    if (createSelectedUsers.size === activePlatformUsers.length && activePlatformUsers.length > 0) {
      setCreateSelectedUsers(new Set());
    } else {
      setCreateSelectedUsers(new Set(activePlatformUsers.map((u) => u._id || u.id)));
    }
  };

  const handleSaveTeam = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!teamForm.name.trim()) {
      showToast('Please enter a team name.', 'warning');
      setModalTab('general');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingTeam) {
        await api.patch(`/api/teams/${editingTeam.id}`, {
          name: teamForm.name.trim(),
          description: teamForm.description.trim(),
          status: teamForm.status,
        });
        showToast(`Team "${teamForm.name}" updated successfully.`);
      } else {
        const createRes = await api.post('/api/teams', {
          name: teamForm.name.trim(),
          description: teamForm.description.trim(),
        });

        const newTeam = createRes.data?.data || createRes.data;
        const newTeamId = newTeam?._id || newTeam?.id;

        // Board selected members if any
        if (newTeamId && createSelectedUsers.size > 0) {
          const selectedList = activePlatformUsers.filter((u) =>
            createSelectedUsers.has(u._id || u.id)
          );

          for (const u of selectedList) {
            const uid = u._id || u.id;
            const roleToAssign = createRoleOverrides[uid] || createDefaultRole || 'Developer';
            try {
              await api.post(`/api/teams/${newTeamId}/members`, {
                userId: uid,
                roleName: roleToAssign,
              });
            } catch (memberErr) {
              console.warn(`Failed adding member ${u.email} to team:`, memberErr);
            }
          }
        }

        const memberMsg =
          createSelectedUsers.size > 0
            ? ` and onboarded ${createSelectedUsers.size} active member(s)`
            : '';
        showToast(`Team "${teamForm.name}" created${memberMsg} successfully.`);
      }
      setIsCreateModalOpen(false);
      fetchTeams();
    } catch (err) {
      console.error('Failed to save team:', err);
      showToast(err.response?.data?.message || 'Failed to save team.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Role Management Handlers
  const handleAddMemberRole = async (targetTeam, member, roleName) => {
    if (!roleName) return;
    const currentRoles = member.roles || [];
    if (currentRoles.includes(roleName)) {
      showToast(`${member.name} already has the "${roleName}" role.`, 'warning');
      return;
    }

    const updatedRoles = [...currentRoles, roleName];

    // Update state
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === targetTeam.id) {
          const updatedMembers = (t.members || []).map((m) =>
            m.id === member.id ? { ...m, roles: updatedRoles } : m
          );
          return { ...t, members: updatedMembers };
        }
        return t;
      })
    );

    if (selectedTeamForMembers?.id === targetTeam.id) {
      setSelectedTeamForMembers((prev) => ({
        ...prev,
        members: (prev.members || []).map((m) =>
          m.id === member.id ? { ...m, roles: updatedRoles } : m
        ),
      }));
    }

    if (editingTeam?.id === targetTeam.id) {
      setEditingTeam((prev) => ({
        ...prev,
        members: (prev.members || []).map((m) =>
          m.id === member.id ? { ...m, roles: updatedRoles } : m
        ),
      }));
    }

    showToast(`Added role "${roleName}" to ${member.name}.`);
  };

  const handleInitiateRemoveMemberRole = (targetTeam, member, roleToRemove) => {
    const currentRoles = member.roles || [];
    // If this is the user's ONLY role, removing it would leave them role-less!
    // Trigger the safeguard modal with reassignment requirement
    if (currentRoles.length <= 1) {
      const defaultReplacement =
        availableRoles.find((r) => r.name !== roleToRemove)?.name || 'Developer';
      setRoleRemovalData({
        team: targetTeam,
        member,
        roleToRemove,
        replacementRole: defaultReplacement,
      });
      return;
    }

    // Otherwise, remove directly
    handleRemoveMemberRoleDirectly(targetTeam, member, roleToRemove);
  };

  const handleRemoveMemberRoleDirectly = (targetTeam, member, roleToRemove) => {
    const currentRoles = member.roles || [];
    const updatedRoles = currentRoles.filter((r) => r !== roleToRemove);

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === targetTeam.id) {
          const updatedMembers = (t.members || []).map((m) =>
            m.id === member.id ? { ...m, roles: updatedRoles } : m
          );
          return { ...t, members: updatedMembers };
        }
        return t;
      })
    );

    if (selectedTeamForMembers?.id === targetTeam.id) {
      setSelectedTeamForMembers((prev) => ({
        ...prev,
        members: (prev.members || []).map((m) =>
          m.id === member.id ? { ...m, roles: updatedRoles } : m
        ),
      }));
    }

    if (editingTeam?.id === targetTeam.id) {
      setEditingTeam((prev) => ({
        ...prev,
        members: (prev.members || []).map((m) =>
          m.id === member.id ? { ...m, roles: updatedRoles } : m
        ),
      }));
    }

    showToast(`Removed role "${roleToRemove}" from ${member.name}.`);
  };

  const handleConfirmMemberRoleReassignment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!roleRemovalData) return;

    try {
      setRoleRemovalLoading(true);
      const { team, member, roleToRemove, replacementRole } = roleRemovalData;
      const currentRoles = member.roles || [];
      const updatedRoles = currentRoles
        .filter((r) => r !== roleToRemove)
        .concat(replacementRole ? [replacementRole] : []);

      const finalRoles = Array.from(new Set(updatedRoles));

      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === team.id) {
            const updatedMembers = (t.members || []).map((m) =>
              m.id === member.id ? { ...m, roles: finalRoles } : m
            );
            return { ...t, members: updatedMembers };
          }
          return t;
        })
      );

      if (selectedTeamForMembers?.id === team.id) {
        setSelectedTeamForMembers((prev) => ({
          ...prev,
          members: (prev.members || []).map((m) =>
            m.id === member.id ? { ...m, roles: finalRoles } : m
          ),
        }));
      }

      if (editingTeam?.id === team.id) {
        setEditingTeam((prev) => ({
          ...prev,
          members: (prev.members || []).map((m) =>
            m.id === member.id ? { ...m, roles: finalRoles } : m
          ),
        }));
      }

      showToast(`Reassigned ${member.name} from "${roleToRemove}" to "${replacementRole}".`);
      setRoleRemovalData(null);
    } catch (err) {
      console.error('Failed to reassign member role:', err);
      showToast('Failed to update member role.', 'error');
    } finally {
      setRoleRemovalLoading(false);
    }
  };

  const handleUpdateTeamMembers = (teamId, updatedMembers) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            members: updatedMembers,
            membersCount: updatedMembers.length,
          };
        }
        return t;
      })
    );

    if (selectedTeamForRoles?.id === teamId) {
      setSelectedTeamForRoles((prev) => ({
        ...prev,
        members: updatedMembers,
        membersCount: updatedMembers.length,
      }));
    }

    if (selectedTeamForMembers?.id === teamId) {
      setSelectedTeamForMembers((prev) => ({
        ...prev,
        members: updatedMembers,
        membersCount: updatedMembers.length,
      }));
    }

    if (editingTeam?.id === teamId) {
      setEditingTeam((prev) => ({
        ...prev,
        members: updatedMembers,
        membersCount: updatedMembers.length,
      }));
    }
  };

  const handleToggleArchive = async (team) => {
    const isArchived = team.status === 'Archived';
    try {
      if (isArchived) {
        await api.patch(`/api/teams/${team.id}`, { status: 'ACTIVE' });
        showToast(`Team "${team.name}" restored to Active.`);
      } else {
        await api.delete(`/api/teams/${team.id}`);
        showToast(`Team "${team.name}" archived.`);
      }
      fetchTeams();
    } catch (err) {
      console.error('Failed to archive team:', err);
      showToast(err.response?.data?.message || 'Failed to update team.', 'error');
    }
  };

  return {
    teams,
    loading,
    searchQuery,
    activeFilter,
    viewMode,
    currentPage,
    pageSize,
    filterTabs,
    filteredTeams,
    paginatedTeams,
    totalItems,
    totalPages,
    safeCurrentPage,
    startIndex,
    endIndex,
    isCreateModalOpen,
    editingTeam,
    modalTab,
    teamForm,
    formSubmitting,
    activePlatformUsers,
    loadingPlatformUsers,
    createSelectedUsers,
    createRoleOverrides,
    createDefaultRole,
    createSelectedRoles,
    createMemberSearch,
    availableRoles,
    selectedTeamForMembers,
    selectedTeamForRoles,
    teamForOnboarding,
    memberSearchQuery,
    roleRemovalData,
    roleRemovalLoading,
    toast,
    enabledRolesForCreate,
    showToast,
    fetchTeams,
    handleFilterChange,
    handleSearchChange,
    setViewMode,
    setCurrentPage,
    setIsCreateModalOpen,
    setModalTab,
    setTeamForm,
    setCreateMemberSearch,
    setCreateDefaultRole,
    setCreateRoleOverrides,
    setSelectedTeamForMembers,
    setSelectedTeamForRoles,
    setTeamForOnboarding,
    setMemberSearchQuery,
    setRoleRemovalData,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleToggleCreateRole,
    handleSelectAllCreateRoles,
    handleToggleCreateUser,
    handleSelectAllCreateUsers,
    handleSaveTeam,
    handleAddMemberRole,
    handleInitiateRemoveMemberRole,
    handleConfirmMemberRoleReassignment,
    handleUpdateTeamMembers,
    handleToggleArchive,
  };
}
