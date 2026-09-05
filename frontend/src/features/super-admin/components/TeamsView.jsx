import { useState, useEffect, useCallback, useMemo } from 'react';
import Toast from '../../../components/shared/Toast.jsx';
import { useToast } from '../../../lib/useToast.js';
import api from '@/lib/api';
import TeamRolesModal from './roles/TeamRolesModal.jsx';
import TeamMemberOnboardingModal from './roles/TeamMemberOnboardingModal.jsx';


export default function TeamsView({ onJumpIntoWorkspace, createTrigger }) {
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
  const fetchActivePlatformUsers = async () => {
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
  };

  // Modal Handlers
  const handleOpenCreateModal = () => {
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
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreateModal();
    }
  }, [createTrigger]);

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
    e.preventDefault();
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

  return (
    <div className="flex flex-col w-full h-full max-w-7xl mx-auto px-lg py-xl space-y-xl">
      {/* Toast Notification */}
      <div className="fixed top-6 right-6 z-1200">
        <Toast message={toast?.msg} type={toast?.type} />
      </div>

      {/* Page Title & Subtitle */}
      <div className="flex flex-col space-y-xs">
        <h1 className="font-display-title text-display-title text-on-surface">Teams &amp; Workspaces</h1>
        <p className="font-body-base text-body-base text-on-surface-variant">
          Global workspace namespaces, team allocations, and operational settings.
        </p>
      </div>

      {/* Toolbar: Search, Filters, View Switcher & Create Action */}
      <div className="flex items-center justify-between w-full p-md bg-surface-container rounded-xl shadow-sm gap-md flex-wrap">
        <div className="relative w-80">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-surface border-none rounded-lg pl-10 pr-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
            placeholder="Search teams by name or description..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-xs flex-wrap">
          {/* Status Tabs */}
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleFilterChange(tab)}
              className={`px-md py-xs font-label-bold text-label-bold rounded-lg shadow-sm transition-colors cursor-pointer ${
                activeFilter === tab
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {tab}
            </button>
          ))}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface p-1 rounded-lg shadow-sm gap-0.5 ml-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Grid Cards View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={handleOpenCreateModal}
            className="ml-md px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            &nbsp;Create Team
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-bold text-label-bold">
                  <th className="py-3.5 px-4 font-semibold border-b border-border-subtle min-w-[240px]">Team / Workspace</th>
                  <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-28">Status</th>
                  <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-32">Members</th>
                  <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-32">Created</th>
                  <th className="py-3.5 px-4 font-semibold border-b border-border-subtle text-right min-w-[290px]">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center text-on-surface-variant">
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        <span>Loading platform teams &amp; workspaces...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center text-on-surface-variant">
                      No teams found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedTeams.map((team) => {
                    const isArchived = team.status === 'Archived';
                    return (
                      <tr key={team.id} className="hover:bg-surface-container-low/50 transition-colors border-b border-border-subtle group">
                        {/* Team Name & Icon */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-sm shrink-0">
                              <span className="material-symbols-outlined text-[18px]">{team.icon}</span>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-label-bold text-label-bold text-on-surface truncate max-w-[220px]" title={team.name}>
                                {team.name}
                              </span>
                              <span className="text-on-surface-variant text-[12px] truncate max-w-[260px]" title={team.description}>
                                {team.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {team.status === 'Active' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-bg text-success-text text-[11px] font-bold shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-success-text mr-1.5 shrink-0"></span>Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant mr-1.5 shrink-0"></span>Archived
                            </span>
                          )}
                        </td>

                        {/* Members Count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedTeamForMembers(team)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium transition-colors cursor-pointer"
                            title="View Members"
                          >
                            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">group</span>
                            <span className="font-bold">{team.membersCount}</span>
                            <span className="text-on-surface-variant">Members</span>
                          </button>
                        </td>

                        {/* Created */}
                        <td className="py-3.5 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">{team.createdAt}</td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTeamForOnboarding(team)}
                              className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 cursor-pointer"
                              title="Onboard Members to Team"
                            >
                              <span className="material-symbols-outlined text-[15px]">person_add</span>
                              <span>Onboard</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedTeamForRoles(team)}
                              className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 cursor-pointer"
                              title="Manage Team Roles & Permissions"
                            >
                              <span className="material-symbols-outlined text-[15px]">badge</span>
                              <span>Roles</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(team)}
                              className="px-2.5 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                              title="Configure Team"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(team)}
                              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                              title={isArchived ? 'Restore Team' : 'Archive Team'}
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                {isArchived ? 'unarchive' : 'archive'}
                              </span>
                            </button>
                            {!isArchived && (
                              <button
                                type="button"
                                onClick={() => onJumpIntoWorkspace?.(team)}
                                className="px-2.5 py-1 bg-primary text-on-primary font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-on-primary-container transition-all flex items-center gap-1 cursor-pointer"
                                title="Jump into workspace"
                              >
                                <span>Jump In</span>
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="w-full flex items-center justify-between p-3.5 px-4 bg-surface-container-low border-t border-border-subtle">
            <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
              Showing {startIndex} to {endIndex} of {totalItems} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage <= 1}
                className={`px-3 py-1 text-[12px] font-label-bold rounded-lg shadow-2xs transition-colors ${
                  safeCurrentPage <= 1
                    ? 'bg-surface text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high cursor-pointer'
                }`}
              >
                Previous
              </button>
              <span className="font-label-sm text-on-surface-variant px-1 text-[12px]">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className={`px-3 py-1 text-[12px] font-label-bold rounded-lg shadow-2xs transition-colors ${
                  safeCurrentPage >= totalPages
                    ? 'bg-surface text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high cursor-pointer'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedTeams.map((team) => {
            const isArchived = team.status === 'Archived';
            return (
              <div
                key={team.id}
                className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 border border-border-subtle shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5 min-w-0"
              >
                <div className="flex flex-col gap-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary font-label-bold flex items-center justify-center shrink-0 shadow-2xs">
                        <span className="material-symbols-outlined text-[19px]">{team.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-label-bold text-label-bold text-on-surface truncate text-[14px]" title={team.name}>
                          {team.name}
                        </span>
                        <span className="text-[11px] text-on-surface-variant truncate">{team.createdAt}</span>
                      </div>
                    </div>
                    {isArchived ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold shadow-2xs shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant mr-1"></span>Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-bg text-success-text text-[10px] font-bold shadow-2xs shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-text mr-1"></span>Active
                      </span>
                    )}
                  </div>

                  <p className="font-body-sm text-[12px] text-on-surface-variant line-clamp-2 min-h-[34px] break-words">
                    {team.description || 'Organizational team workspace.'}
                  </p>
                </div>

                {/* Structured 2-row footer so buttons never overflow */}
                <div className="pt-3 border-t border-border-subtle flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamForMembers(team)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[12px] font-medium transition-colors cursor-pointer"
                      title="View Members"
                    >
                      <span className="material-symbols-outlined text-[15px]">group</span>
                      <span className="font-bold text-on-surface">{team.membersCount}</span>
                      <span>Members</span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(team)}
                        className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                        title={isArchived ? 'Restore Team' : 'Archive Team'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isArchived ? 'unarchive' : 'archive'}
                        </span>
                      </button>
                      {!isArchived ? (
                        <button
                          type="button"
                          onClick={() => onJumpIntoWorkspace?.(team)}
                          className="px-2.5 py-1 bg-primary text-on-primary text-[11px] font-bold rounded-lg shadow-2xs hover:bg-on-primary-container transition-all flex items-center gap-1 cursor-pointer"
                          title="Jump into workspace"
                        >
                          <span>Jump In</span>
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-on-surface-variant px-2 py-0.5 bg-surface-container rounded">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Secondary Action Toolbar */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTeamForOnboarding(team)}
                      className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                      title="Onboard Members to Team"
                    >
                      <span className="material-symbols-outlined text-[14px]">person_add</span>
                      <span className="truncate">Onboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamForRoles(team)}
                      className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                      title="Manage Team Roles & Permissions"
                    >
                      <span className="material-symbols-outlined text-[14px]">badge</span>
                      <span className="truncate">Roles</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(team)}
                      className="px-1.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-semibold rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                      title="Edit Team"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span className="truncate">Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Members Modal */}
      {selectedTeamForMembers && (
        <div className="fixed inset-0 z-100 flex justify-end bg-on-primary-fixed/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col border-l border-border-subtle animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-lg border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary font-label-bold flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{selectedTeamForMembers.icon}</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-on-surface">{selectedTeamForMembers.name}</h2>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    {selectedTeamForMembers.members?.length || selectedTeamForMembers.membersCount || 0} active members assigned
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeamForMembers(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Search & Onboard Action */}
            <div className="p-md border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between gap-sm">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-surface border-none rounded-lg pl-9 pr-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm text-[12px]"
                />
              </div>

              <button
                type="button"
                onClick={() => setTeamForOnboarding(selectedTeamForMembers)}
                className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center gap-1 transition-colors cursor-pointer text-[12px] shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Onboard</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-md space-y-sm">
              {(!selectedTeamForMembers.members || selectedTeamForMembers.members.length === 0) ? (
                <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[32px] text-outline">group_off</span>
                  <span className="text-body-sm">No member details available for this workspace.</span>
                </div>
              ) : (
                selectedTeamForMembers.members
                  .filter((m) => {
                    const q = memberSearchQuery.toLowerCase().trim();
                    return !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
                  })
                  .map((m) => {
                    const initials = m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
                    const memberRoles = m.roles || ['Member'];

                    return (
                      <div
                        key={m.id || m._id || m.email}
                        className="p-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-sm border border-border-subtle/50"
                      >
                        <div className="flex items-center justify-between gap-md">
                          <div className="flex items-center gap-md min-w-0">
                            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-sm shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-bold text-label-bold text-on-surface truncate">{m.name}</span>
                              <span className="text-on-surface-variant text-[12px] truncate">{m.email}</span>
                            </div>
                          </div>

                          {/* Quick Role Adder */}
                          <div className="relative shrink-0">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddMemberRole(selectedTeamForMembers, m, e.target.value);
                                }
                              }}
                              className="text-[11px] font-label-bold bg-surface-container-high hover:bg-surface-container text-on-surface px-2 py-1 rounded-md border border-border-subtle cursor-pointer outline-none"
                              title="Assign another role to this member"
                            >
                              <option value="">+ Add Role</option>
                              {availableRoles
                                .filter((r) => !memberRoles.includes(r.name))
                                .map((r) => (
                                  <option key={r.id || r.name} value={r.name}>
                                    {r.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        {/* Role Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {memberRoles.map((roleName) => {
                            const isTeamAdmin = roleName.toLowerCase().includes('admin');
                            return (
                              <span
                                key={roleName}
                                className={`px-2 py-0.5 rounded-md font-label-sm text-[11px] shadow-2xs flex items-center gap-1.5 transition-all ${
                                  isTeamAdmin
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-medium'
                                    : 'bg-surface-container-highest text-on-surface border border-border-subtle'
                                }`}
                              >
                                {isTeamAdmin && (
                                  <span className="material-symbols-outlined text-[12px] text-amber-600">crown</span>
                                )}
                                <span>{roleName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleInitiateRemoveMemberRole(selectedTeamForMembers, m, roleName)}
                                  className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center text-outline hover:text-error-text cursor-pointer ml-0.5"
                                  title={`Remove "${roleName}" role`}
                                >
                                  <span className="material-symbols-outlined text-[11px]">close</span>
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="p-md border-t border-border-subtle bg-surface-container-low flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTeamForMembers(null)}
                className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-on-primary-fixed/40 backdrop-blur-sm p-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-lg pb-md border-b border-border-subtle bg-surface-container-low shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">
                    {editingTeam ? 'tune' : 'add_business'}
                  </span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    {editingTeam ? 'Team Workspace Settings' : 'Create New Team'}
                  </h2>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    {editingTeam
                      ? 'Modify team metadata, lifecycle state, and member role assignments.'
                      : 'Provision a new isolated team workspace and assign domain policies.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-md px-lg pt-sm bg-surface-container-low border-b border-border-subtle shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`pb-2.5 font-label-bold text-label-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'general'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                <span>{editingTeam ? 'General Settings' : '1. General Details'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('roles')}
                className={`pb-2.5 font-label-bold text-label-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'roles'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>{editingTeam ? 'Team Roles & Members' : '2. Team Roles'}</span>
                {editingTeam && (
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-[11px]">
                    {editingTeam.members?.length || 0}
                  </span>
                )}
                {!editingTeam && availableRoles.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-[11px]">
                    {availableRoles.length}
                  </span>
                )}
              </button>

              {!editingTeam && (
                <button
                  type="button"
                  onClick={() => setModalTab('members')}
                  className={`pb-2.5 font-label-bold text-label-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'members'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>3. Add Members</span>
                  {createSelectedUsers.size > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-bold text-[11px]">
                      {createSelectedUsers.size}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* TAB: General Details */}
            {modalTab === 'general' && (
              <form onSubmit={(e) => { e.preventDefault(); setModalTab('roles'); }} className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-sm text-on-surface">
                    Team Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering Core"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-surface border border-border-subtle rounded-lg px-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-sm text-on-surface">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Operational scope and description of this team workspace..."
                    value={teamForm.description}
                    onChange={(e) => setTeamForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface border border-border-subtle rounded-lg p-md font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm resize-none"
                  />
                </div>

                {editingTeam && (
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-bold text-label-sm text-on-surface">Lifecycle Status</label>
                    <select
                      value={teamForm.status}
                      onChange={(e) => setTeamForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-surface border border-border-subtle rounded-lg px-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between pt-md border-t border-border-subtle mt-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-sm">
                    {!editingTeam && (
                      <button
                        type="button"
                        onClick={() => setModalTab('roles')}
                        className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Next: Roles</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveTeam}
                      disabled={formSubmitting || !teamForm.name.trim()}
                      className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {formSubmitting
                        ? 'Saving...'
                        : editingTeam
                        ? 'Save Changes'
                        : createSelectedUsers.size > 0
                        ? `Create Team (${createSelectedUsers.size} Members)`
                        : 'Create Team'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB: Team Roles */}
            {modalTab === 'roles' && (
              editingTeam ? (
                /* Edit Team: Member Roles */
                <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between pb-xs border-b border-border-subtle">
                    <div>
                      <h3 className="font-label-bold text-label-bold text-on-surface">Workspace Member Roles</h3>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        Assign, reassign, or remove roles for members within this team workspace.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-sm">
                    {(!editingTeam.members || editingTeam.members.length === 0) ? (
                      <div className="p-lg text-center text-on-surface-variant">
                        No members assigned to this team yet.
                      </div>
                    ) : (
                      editingTeam.members.map((m) => {
                        const initials = m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
                        const memberRoles = m.roles || ['Member'];

                        return (
                          <div
                            key={m.id || m._id || m.email}
                            className="p-md rounded-xl bg-surface-container-low border border-border-subtle/60 flex flex-col gap-xs"
                          >
                            <div className="flex items-center justify-between gap-md">
                              <div className="flex items-center gap-sm min-w-0">
                                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {initials}
                                </div>
                                <div className="truncate">
                                  <span className="font-label-bold text-label-sm text-on-surface block truncate">{m.name}</span>
                                  <span className="text-[11px] text-on-surface-variant truncate block">{m.email}</span>
                                </div>
                              </div>

                              {/* Role Adder */}
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddMemberRole(editingTeam, m, e.target.value);
                                  }
                                }}
                                className="text-[11px] font-label-bold bg-surface-container-highest text-on-surface px-2 py-1 rounded-md border border-border-subtle cursor-pointer outline-none"
                              >
                                <option value="">+ Assign Role</option>
                                {availableRoles
                                  .filter((r) => !memberRoles.includes(r.name))
                                  .map((r) => (
                                    <option key={r.id || r.name} value={r.name}>
                                      {r.name}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            {/* Member Role Chips */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {memberRoles.map((roleName) => (
                                <span
                                  key={roleName}
                                  className="px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface text-[11px] font-label-sm flex items-center gap-1 border border-border-subtle shadow-2xs"
                                >
                                  <span>{roleName}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateRemoveMemberRole(editingTeam, m, roleName)}
                                    className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center text-outline hover:text-error-text cursor-pointer"
                                    title={`Remove "${roleName}"`}
                                  >
                                    <span className="material-symbols-outlined text-[10px]">close</span>
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-md border-t border-border-subtle mt-auto">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Create Team: Workspace Roles Selection */
                <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
                  <div className="p-sm rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-sm">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
                    <p className="text-body-sm text-on-surface text-[12px] leading-relaxed">
                      Select which platform roles to enable for this team workspace. Members onboarded to this team can only be assigned from these enabled roles.
                    </p>
                  </div>

                  {/* Role Selection Toolbar */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-label-bold text-label-sm text-on-surface uppercase tracking-wider">
                        Configure Team Roles
                      </span>
                      <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {createSelectedRoles.size} of {availableRoles.length} Enabled
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectAllCreateRoles}
                      className="text-[11px] font-label-bold px-2 py-1 rounded-md bg-surface-container-highest text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
                    >
                      {createSelectedRoles.size === availableRoles.length && availableRoles.length > 0
                        ? 'Reset Selection'
                        : 'Select All Roles'}
                    </button>
                  </div>

                  {/* Role Selectable Cards */}
                  <div className="grid grid-cols-1 gap-xs max-h-[300px] overflow-y-auto pr-1">
                    {availableRoles.map((role) => {
                      const roleIdentifier = role.name || role.id;
                      const isRoleSelected = createSelectedRoles.has(roleIdentifier) || createSelectedRoles.has(role.id) || createSelectedRoles.has(role._id);

                      return (
                        <div
                          key={role.id || role._id || role.name}
                          onClick={() => handleToggleCreateRole(roleIdentifier)}
                          className={`p-sm rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-sm ${
                            isRoleSelected
                              ? 'bg-primary/5 border-primary shadow-2xs'
                              : 'bg-surface-container-low border-border-subtle/70 hover:border-border-subtle hover:bg-surface-container opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-sm min-w-0">
                            <input
                              type="checkbox"
                              checked={isRoleSelected}
                              onChange={() => handleToggleCreateRole(roleIdentifier)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer"
                            />

                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isRoleSelected
                                  ? 'bg-primary text-on-primary shadow-xs'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {role.name?.toLowerCase().includes('admin')
                                  ? 'shield_person'
                                  : role.name?.toLowerCase().includes('lead')
                                  ? 'group_work'
                                  : 'badge'}
                              </span>
                            </div>

                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="font-label-bold text-label-sm text-on-surface">
                                  {role.name}
                                </span>
                                {role.isSystem && (
                                  <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-[10px] text-on-surface-variant font-medium">
                                    System
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-on-surface-variant line-clamp-1">
                                {role.description || 'Configured team permission set.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                              {role.permissionCount ?? (role.permissions?.length || 0)} perms
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-label-bold uppercase tracking-wider ${
                                isRoleSelected
                                  ? 'bg-success-container/40 text-success'
                                  : 'bg-surface-container-highest text-on-surface-variant'
                              }`}
                            >
                              {isRoleSelected ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-md border-t border-border-subtle mt-auto">
                    <button
                      type="button"
                      onClick={() => setModalTab('general')}
                      className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      <span>Back</span>
                    </button>

                    <div className="flex items-center gap-sm">
                      <button
                        type="button"
                        onClick={() => setModalTab('members')}
                        className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Next: Add Members</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTeam}
                        disabled={formSubmitting || !teamForm.name.trim()}
                        className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {formSubmitting ? 'Saving...' : 'Create Team'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* TAB: Add Members (Create Team Flow) */}
            {modalTab === 'members' && !editingTeam && (
              <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
                {/* Search & Bulk Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-sm bg-surface-container-low p-sm rounded-xl border border-border-subtle">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search active platform users..."
                      value={createMemberSearch}
                      onChange={(e) => setCreateMemberSearch(e.target.value)}
                      className="w-full bg-surface pl-8 pr-3 py-1.5 rounded-lg border border-border-subtle font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-sm shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-on-surface-variant font-label-bold">Default Role:</span>
                      <select
                        value={createDefaultRole}
                        onChange={(e) => setCreateDefaultRole(e.target.value)}
                        className="text-[11px] font-label-bold bg-surface border border-border-subtle rounded-md px-2 py-1 text-on-surface cursor-pointer outline-none"
                      >
                        {enabledRolesForCreate.map((r) => (
                          <option key={r.id || r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectAllCreateUsers}
                      className="text-[11px] font-label-bold px-2 py-1 rounded-md bg-surface-container-highest text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
                    >
                      {createSelectedUsers.size === activePlatformUsers.length && activePlatformUsers.length > 0
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Selected Count & Active Indicator */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] font-label-bold text-on-surface">
                    Active Users ({activePlatformUsers.length}) · <span className="text-primary font-normal">{enabledRolesForCreate.length} Enabled Team Roles</span>
                  </span>
                  <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {createSelectedUsers.size} Selected for Onboarding
                  </span>
                </div>

                {/* Active Users List */}
                <div className="space-y-xs max-h-[300px] overflow-y-auto pr-1">
                  {loadingPlatformUsers ? (
                    <div className="p-xl text-center text-on-surface-variant text-body-sm">
                      Loading active platform users...
                    </div>
                  ) : activePlatformUsers.length === 0 ? (
                    <div className="p-xl text-center text-on-surface-variant text-body-sm">
                      No active platform users found to board.
                    </div>
                  ) : (
                    activePlatformUsers
                      .filter((u) => {
                        const q = createMemberSearch.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q))
                        );
                      })
                      .map((u) => {
                        const uid = u._id || u.id;
                        const isSelected = createSelectedUsers.has(uid);
                        const initials =
                          u.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'U';
                        const assignedRole = createRoleOverrides[uid] || createDefaultRole;

                        return (
                          <div
                            key={uid}
                            onClick={() => handleToggleCreateUser(uid)}
                            className={`p-sm rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-sm ${
                              isSelected
                                ? 'bg-primary/5 border-primary shadow-2xs'
                                : 'bg-surface-container-low border-border-subtle/70 hover:border-border-subtle hover:bg-surface-container'
                            }`}
                          >
                            <div className="flex items-center gap-sm min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCreateUser(uid)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer"
                              />
                              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-label-bold text-label-sm text-on-surface block truncate">
                                    {u.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-full bg-success-container/40 text-success font-label-bold text-[9px] uppercase tracking-wider">
                                    Active
                                  </span>
                                </div>
                                <span className="text-[11px] text-on-surface-variant truncate block">
                                  {u.email}
                                </span>
                              </div>
                            </div>

                            {/* Assigned Role Selector from Enabled Roles */}
                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={assignedRole}
                                onChange={(e) => {
                                  setCreateRoleOverrides((prev) => ({
                                    ...prev,
                                    [uid]: e.target.value,
                                  }));
                                  if (!isSelected) {
                                    handleToggleCreateUser(uid);
                                  }
                                }}
                                className="text-[11px] font-label-bold bg-surface border border-border-subtle rounded-md px-2 py-1 text-on-surface cursor-pointer outline-none focus:border-primary"
                              >
                                {enabledRolesForCreate.map((r) => (
                                  <option key={r.id || r.name} value={r.name}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-md border-t border-border-subtle mt-auto">
                  <button
                    type="button"
                    onClick={() => setModalTab('roles')}
                    className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>Back</span>
                  </button>

                  <div className="flex items-center gap-sm">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTeam}
                      disabled={formSubmitting || !teamForm.name.trim()}
                      className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {formSubmitting ? (
                        <span>Creating Team...</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>
                            {createSelectedUsers.size > 0
                              ? `Create Team & Add ${createSelectedUsers.size} Member(s)`
                              : 'Create Team'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Removal Safeguard Modal */}
      {roleRemovalData && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setRoleRemovalData(null)}
          />

          <div
            className="relative bg-card-bg rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Header */}
            <div className="p-lg bg-warning-bg/30 border-b border-warning-text/30 flex items-start gap-md">
              <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning-text border border-warning-text/40 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="flex-1">
                <span className="px-2 py-0.5 rounded bg-warning-bg text-warning-text font-label-bold text-[10px] uppercase tracking-wider">
                  Active Role Removal Safeguard
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface mt-0.5">
                  Reassign Active Role
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRoleRemovalData(null)}
                className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmMemberRoleReassignment} className="p-lg space-y-md">
              <div className="p-sm rounded-xl bg-surface-container-low border border-border-subtle space-y-1 text-body-sm">
                <p className="text-on-surface font-semibold">
                  {roleRemovalData.member?.name} is losing their primary role &ldquo;{roleRemovalData.roleToRemove}&rdquo;.
                </p>
                <p className="text-on-surface-variant text-[12px] leading-relaxed">
                  To prevent orphaned members and ensure uninterrupted workspace permissions in <strong>{roleRemovalData.team?.name}</strong>, please select a replacement role.
                </p>
              </div>

              <div className="space-y-xs">
                <label className="block font-label-bold text-label-sm text-on-surface">
                  Select Replacement Role <span className="text-error">*</span>
                </label>
                <select
                  value={roleRemovalData.replacementRole}
                  onChange={(e) =>
                    setRoleRemovalData((prev) => ({ ...prev, replacementRole: e.target.value }))
                  }
                  className="w-full h-10 px-sm bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  required
                >
                  {availableRoles
                    .filter((r) => r.name !== roleRemovalData.roleToRemove)
                    .map((r) => (
                      <option key={r.id || r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm">
                <button
                  type="button"
                  onClick={() => setRoleRemovalData(null)}
                  disabled={roleRemovalLoading}
                  className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleRemovalLoading}
                  className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {roleRemovalLoading ? (
                    <span>Reassigning...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      <span>Reassign &amp; Update</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Roles Modal */}
      {selectedTeamForRoles && (
        <TeamRolesModal
          isOpen={Boolean(selectedTeamForRoles)}
          team={selectedTeamForRoles}
          availableRoles={availableRoles}
          onClose={() => setSelectedTeamForRoles(null)}
          onUpdateTeamMembers={handleUpdateTeamMembers}
          showToast={showToast}
        />
      )}

      {/* Member Onboarding Modal */}
      {teamForOnboarding && (
        <TeamMemberOnboardingModal
          isOpen={Boolean(teamForOnboarding)}
          team={teamForOnboarding}
          availableRoles={availableRoles}
          onClose={() => setTeamForOnboarding(null)}
          onOnboardMembers={handleUpdateTeamMembers}
          showToast={showToast}
        />
      )}
    </div>
  );
}
