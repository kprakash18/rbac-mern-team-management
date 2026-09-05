import { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import TeamMemberOnboardingModal from './TeamMemberOnboardingModal.jsx';

export default function TeamRolesModal({
  isOpen,
  team,
  availableRoles = [],
  onClose,
  onUpdateTeamMembers,
  showToast,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchedRoles, setFetchedRoles] = useState([]);

  // Fetch all custom and platform roles from backend API when modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      api
        .get('/api/roles?status=all')
        .then((res) => {
          if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
            setFetchedRoles(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Could not fetch platform roles from database:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Derive all available platform roles directly from the database API
  const allPlatformRoles = useMemo(() => {
    const rawList = fetchedRoles.length > 0 ? fetchedRoles : availableRoles;
    const map = new Map();

    // Add all real database roles
    (rawList || []).forEach((r) => {
      if (!r || !r.name) return;
      const key = r.name.toLowerCase();
      const isSystem = Boolean(r.isSystemRole || r.type === 'system');
      const permKeys = Array.isArray(r.permissions)
        ? r.permissions.map((p) => (typeof p === 'string' ? p : p?.key || p?.name)).filter(Boolean)
        : Array.isArray(r.permissionKeys)
        ? r.permissionKeys
        : [];

      map.set(key, {
        id: r._id || r.id || `role-${key}`,
        _id: r._id || r.id,
        name: r.name,
        type: isSystem ? 'system' : 'custom',
        isSystem,
        status: (r.status || 'ACTIVE').toUpperCase(),
        description: r.description || (isSystem ? 'System core platform role' : 'Custom database role'),
        permissionKeys: permKeys,
        membersCount: r.membersCount ?? (r.assignedUsers?.length || 0),
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [availableRoles, fetchedRoles]);

  // Sub-modal states
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleSelection, setNewRoleSelection] = useState('');
  const [selectedMemberIdsForNewRole, setSelectedMemberIdsForNewRole] = useState(new Set());
  const [memberSearchInAddModal, setMemberSearchInAddModal] = useState('');

  const [editingRoleMembers, setEditingRoleMembers] = useState(null); // roleName string
  const [memberIdsInRole, setMemberIdsInRole] = useState(new Set());
  const [memberSearchInEditModal, setMemberSearchInEditModal] = useState('');

  const [viewMode, setViewMode] = useState('roles'); // 'roles' | 'members'
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [deletingRoleData, setDeletingRoleData] = useState(null); // { roleName, affectedMembers, replacementRole }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Derive all active roles in this team
  const teamMembers = useMemo(() => {
    return Array.isArray(team?.members) ? team.members : [];
  }, [team]);

  const teamRolesList = useMemo(() => {
    if (!team) return [];

    const rolesSet = new Set();
    teamMembers.forEach((m) => {
      (m.roles || ['Member']).forEach((r) => {
        if (r) rolesSet.add(r);
      });
    });

    const catalogMap = new Map(allPlatformRoles.map((r) => [r.name.toLowerCase(), r]));

    return Array.from(rolesSet).map((roleName) => {
      const matchingCatalog = catalogMap.get(roleName.toLowerCase());
      const assignedMembers = teamMembers.filter((m) =>
        (m.roles || ['Member']).some((r) => r.toLowerCase() === roleName.toLowerCase())
      );

      const isSystem = Boolean(
        matchingCatalog?.isSystem ||
        matchingCatalog?.isSystemRole ||
        matchingCatalog?.type === 'system' ||
        ['super admin', 'team admin', 'viewer', 'developer', 'security auditor'].includes(roleName.toLowerCase())
      );

      return {
        name: roleName,
        catalogId: matchingCatalog?._id || matchingCatalog?.id,
        description: matchingCatalog?.description || (isSystem ? 'System core platform role' : 'Custom team role'),
        isSystem,
        permissionCount: matchingCatalog?.permissionKeys?.length || matchingCatalog?.permissions?.length || 0,
        members: assignedMembers,
        membersCount: assignedMembers.length,
      };
    });
  }, [team, teamMembers, allPlatformRoles]);

  // Filtered Team Roles
  const filteredTeamRoles = useMemo(() => {
    return teamRolesList.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.members.some((m) => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q))
      );
    });
  }, [teamRolesList, searchQuery]);

  // Filtered Team Members for Member View
  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.roles || []).some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [teamMembers, searchQuery]);

  // Selected Role details preview in Add Modal
  const selectedRoleDetails = useMemo(() => {
    if (!newRoleSelection) return null;
    return allPlatformRoles.find((r) => r.name.toLowerCase() === newRoleSelection.toLowerCase()) || null;
  }, [newRoleSelection, allPlatformRoles]);

  // Replacement role options for Safe Delete Modal
  const replacementRoleOptions = useMemo(() => {
    if (!deletingRoleData) return [];
    const currentRoleName = deletingRoleData.roleName.toLowerCase();
    const map = new Map();
    teamRolesList.forEach((r) => {
      if (r.name.toLowerCase() !== currentRoleName) {
        map.set(r.name.toLowerCase(), { name: r.name, isSystem: r.isSystem, inTeam: true });
      }
    });
    allPlatformRoles.forEach((r) => {
      if (r.name.toLowerCase() !== currentRoleName && !map.has(r.name.toLowerCase())) {
        map.set(r.name.toLowerCase(), { name: r.name, isSystem: r.isSystem, inTeam: false });
      }
    });
    return Array.from(map.values());
  }, [deletingRoleData, teamRolesList, allPlatformRoles]);

  if (!isOpen || !team) return null;

  // --- Handlers ---

  // Add role directly to a member
  const handleAddRoleToMember = (member, roleName) => {
    if (!roleName) return;
    const currentRoles = member.roles || ['Member'];
    if (currentRoles.includes(roleName)) return;

    const updatedMembers = teamMembers.map((m) =>
      m.id === member.id ? { ...m, roles: [...currentRoles, roleName] } : m
    );
    onUpdateTeamMembers(team.id, updatedMembers);
    showToast?.(`Added role "${roleName}" to ${member.name}.`);
  };

  // Remove role directly from a member
  const handleRemoveRoleFromMember = (member, roleName) => {
    const currentRoles = member.roles || ['Member'];
    if (currentRoles.length <= 1) {
      if (window.confirm(`${member.name} has only 1 role assigned. Removing "${roleName}" will reset their role to "Developer". Continue?`)) {
        const updatedMembers = teamMembers.map((m) =>
          m.id === member.id ? { ...m, roles: ['Developer'] } : m
        );
        onUpdateTeamMembers(team.id, updatedMembers);
        showToast?.(`Reset ${member.name}'s role to "Developer".`);
      }
      return;
    }

    const updatedMembers = teamMembers.map((m) => {
      if (m.id === member.id) {
        const filtered = currentRoles.filter((r) => r !== roleName);
        return { ...m, roles: filtered.length > 0 ? filtered : ['Developer'] };
      }
      return m;
    });
    onUpdateTeamMembers(team.id, updatedMembers);
    showToast?.(`Removed role "${roleName}" from ${member.name}.`);
  };

  // Open Add Role Modal
  const handleOpenAddRoleModal = () => {
    const existingRoleNames = new Set(teamRolesList.map((r) => r.name.toLowerCase()));
    const candidate = allPlatformRoles.find((r) => !existingRoleNames.has(r.name.toLowerCase())) || allPlatformRoles[0];
    setNewRoleSelection(candidate ? candidate.name : 'Developer');
    setSelectedMemberIdsForNewRole(new Set());
    setMemberSearchInAddModal('');
    setIsAddRoleModalOpen(true);
  };

  // Submit Add Role to Team
  const handleConfirmAddRole = (e) => {
    e.preventDefault();
    if (!newRoleSelection.trim()) return;

    const roleName = newRoleSelection.trim();
    const updatedMembers = teamMembers.map((m) => {
      if (selectedMemberIdsForNewRole.has(m.id)) {
        const currentRoles = m.roles || ['Member'];
        if (!currentRoles.includes(roleName)) {
          return { ...m, roles: [...currentRoles, roleName] };
        }
      }
      return m;
    });

    onUpdateTeamMembers(team.id, updatedMembers);
    showToast?.(`Role "${roleName}" added to "${team.name}" with ${selectedMemberIdsForNewRole.size} assigned member(s).`);
    setIsAddRoleModalOpen(false);
  };

  // Open Edit Role Members Modal
  const handleOpenEditRoleMembers = (role) => {
    setEditingRoleMembers(role.name);
    const memberIds = new Set(role.members.map((m) => m.id));
    setMemberIdsInRole(memberIds);
    setMemberSearchInEditModal('');
  };

  // Submit Edit Role Members
  const handleSaveRoleMembers = (e) => {
    e.preventDefault();
    if (!editingRoleMembers) return;

    const roleName = editingRoleMembers;
    const updatedMembers = teamMembers.map((m) => {
      const currentRoles = m.roles || ['Member'];
      const shouldHaveRole = memberIdsInRole.has(m.id);

      if (shouldHaveRole && !currentRoles.includes(roleName)) {
        return { ...m, roles: [...currentRoles, roleName] };
      }
      if (!shouldHaveRole && currentRoles.includes(roleName)) {
        const remaining = currentRoles.filter((r) => r !== roleName);
        return { ...m, roles: remaining.length > 0 ? remaining : ['Member'] };
      }
      return m;
    });

    onUpdateTeamMembers(team.id, updatedMembers);
    showToast?.(`Updated member assignments for role "${roleName}".`);
    setEditingRoleMembers(null);
  };

  // Initiate Delete Role from Team
  const handleInitiateDeleteRole = (role) => {
    if (role.membersCount > 0) {
      // Find other active roles in team for replacement
      const otherRoles = teamRolesList.filter((r) => r.name !== role.name);
      const defaultReplacement = otherRoles.length > 0 ? otherRoles[0].name : 'Developer';

      setDeletingRoleData({
        roleName: role.name,
        affectedMembers: role.members,
        replacementRole: defaultReplacement,
      });
      return;
    }

    if (window.confirm(`Are you sure you want to remove role "${role.name}" from team "${team.name}"?`)) {
      // Role has 0 members, remove from team
      const updatedMembers = teamMembers.map((m) => ({
        ...m,
        roles: (m.roles || ['Member']).filter((r) => r !== role.name),
      }));
      onUpdateTeamMembers(team.id, updatedMembers);
      showToast?.(`Removed role "${role.name}" from "${team.name}".`);
    }
  };

  // Confirm Safe Delete with Member Reassignment
  const handleConfirmSafeDeleteRole = async (e) => {
    e.preventDefault();
    if (!deletingRoleData) return;

    try {
      setDeleteLoading(true);
      const { roleName, replacementRole } = deletingRoleData;

      const updatedMembers = teamMembers.map((m) => {
        const currentRoles = m.roles || ['Member'];
        if (currentRoles.includes(roleName)) {
          const filtered = currentRoles.filter((r) => r !== roleName);
          if (replacementRole && !filtered.includes(replacementRole)) {
            filtered.push(replacementRole);
          }
          return { ...m, roles: filtered.length > 0 ? filtered : ['Member'] };
        }
        return m;
      });

      onUpdateTeamMembers(team.id, updatedMembers);
      showToast?.(
        `Reassigned ${deletingRoleData.affectedMembers.length} member(s) to "${replacementRole}" and deleted "${roleName}" from "${team.name}".`
      );
      setDeletingRoleData(null);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to delete role and reassign members.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-md animate-in fade-in duration-150" id="modal-team-roles">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div
        className="relative bg-card-bg rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-border-subtle z-[1050] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-lg bg-surface-container-low border-b border-border-subtle flex items-center justify-between gap-md shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary font-label-bold flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">badge</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {team.name} Roles &amp; Permissions
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-bold text-[11px]">
                  {teamRolesList.length} Roles Active
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                Manage roles, assign team members, and configure workspace RBAC policies for this team.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-primary hover:text-on-primary flex items-center gap-1.5 transition-all cursor-pointer text-[13px]"
              title="Onboard active platform users to team"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Onboard Members</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddRoleModal}
              className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center gap-1.5 transition-colors cursor-pointer text-[13px]"
            >
              <span className="material-symbols-outlined text-[18px]">add_moderator</span>
              <span>Add Role to Team</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs & Search Toolbar */}
        <div className="p-md bg-surface-container-lowest border-b border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="inline-flex rounded-lg bg-surface-container p-1 border border-border-subtle">
              <button
                type="button"
                onClick={() => setViewMode('roles')}
                className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'roles'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">badge</span>
                <span>By Roles ({teamRolesList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('members')}
                className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'members'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">group</span>
                <span>By Members ({teamMembers.length})</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 max-w-md w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
            <input
              type="text"
              placeholder={viewMode === 'roles' ? 'Search team roles or assigned members...' : 'Search members or roles...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs text-[13px]"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-lg overflow-y-auto flex-1 space-y-md bg-surface">
          {viewMode === 'roles' ? (
            /* --- BY ROLES VIEW --- */
            filteredTeamRoles.length === 0 ? (
              <div className="p-xl text-center flex flex-col items-center gap-2 bg-card-bg rounded-xl border border-dashed border-border-subtle text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px] text-outline">badge</span>
                <p className="font-semibold text-on-surface">No roles match your search.</p>
                <button
                  type="button"
                  onClick={handleOpenAddRoleModal}
                  className="mt-2 px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container cursor-pointer"
                >
                  + Add Role to Team
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {filteredTeamRoles.map((role) => (
                  <div
                    key={role.name}
                    className="bg-card-bg rounded-xl p-md border border-border-subtle shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-md"
                  >
                    <div className="space-y-sm">
                      {/* Card Top */}
                      <div className="flex items-start justify-between gap-sm">
                        <div className="flex items-center gap-sm">
                          <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center font-bold shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              {role.isSystem ? 'shield_person' : 'badge'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-headline-md text-on-surface text-[15px] font-bold">{role.name}</h4>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-label-bold ${
                                  role.isSystem
                                    ? 'bg-surface-container-high text-on-surface'
                                    : 'bg-primary-fixed text-on-primary-fixed'
                                }`}
                              >
                                {role.isSystem ? 'SYSTEM' : 'CUSTOM'}
                              </span>
                            </div>
                            <span className="text-[11px] text-outline block">{role.permissionCount} Permissions</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoleMembers(role)}
                            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Edit members in this role"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInitiateDeleteRole(role)}
                            className="p-1.5 rounded-lg hover:bg-error-bg text-on-surface-variant hover:text-error-text transition-colors cursor-pointer"
                            title="Delete role from team"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-[12px] text-on-surface-variant line-clamp-2 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    {/* Assigned Members Chips */}
                    <div className="pt-2 border-t border-border-subtle/50 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] font-label-bold text-on-surface-variant">
                        <span>Assigned Members ({role.membersCount})</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRoleMembers(role)}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>

                      {role.membersCount === 0 ? (
                        <span className="text-[11px] text-outline italic">No members currently assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {role.members.map((m) => {
                            const initials = (m.name || m.email || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                            return (
                              <span
                                key={m.id || m._id || m.email}
                                className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px] flex items-center gap-1 border border-border-subtle shadow-2xs truncate max-w-[140px]"
                                title={`${m.name} (${m.email})`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-primary-container text-on-primary text-[9px] flex items-center justify-center font-bold shrink-0">
                                  {initials}
                                </span>
                                <span className="truncate">{m.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* --- BY MEMBERS VIEW --- */
            filteredTeamMembers.length === 0 ? (
              <div className="p-xl text-center flex flex-col items-center gap-2 bg-card-bg rounded-xl border border-dashed border-border-subtle text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px] text-outline">group</span>
                <p className="font-semibold text-on-surface">No members match your search.</p>
              </div>
            ) : (
              <div className="space-y-sm">
                {filteredTeamMembers.map((m) => {
                  const initials = (m.name || m.email || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  const memberRoles = m.roles || ['Member'];
                  const unassignedRoles = allPlatformRoles.filter((r) => !memberRoles.includes(r.name));

                  return (
                    <div
                      key={m.id || m._id || m.email}
                      className="p-md rounded-xl bg-card-bg border border-border-subtle shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-md"
                    >
                      {/* Member Info */}
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-[13px] shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-label-bold text-[14px] text-on-surface font-bold">{m.name}</span>
                          </div>
                          <span className="text-[12px] text-on-surface-variant">{m.email}</span>
                        </div>
                      </div>

                      {/* Role Pills & Quick Add */}
                      <div className="flex flex-wrap items-center gap-2">
                        {memberRoles.map((roleName) => {
                          const isTeamAdmin = roleName.toLowerCase().includes('admin');
                          return (
                            <span
                              key={roleName}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-label-bold flex items-center gap-1.5 shadow-2xs border ${
                                isTeamAdmin
                                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                  : 'bg-surface-container-high text-on-surface border-border-subtle'
                              }`}
                            >
                              {isTeamAdmin && (
                                <span className="material-symbols-outlined text-[13px] text-amber-600">crown</span>
                              )}
                              <span>{roleName}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRoleFromMember(m, roleName)}
                                className="w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-outline hover:text-error-text transition-colors cursor-pointer ml-0.5"
                                title={`Remove "${roleName}" from ${m.name}`}
                              >
                                <span className="material-symbols-outlined text-[11px]">close</span>
                              </button>
                            </span>
                          );
                        })}

                        {/* Quick Add Role Selector */}
                        {unassignedRoles.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddRoleToMember(m, e.target.value);
                              }
                            }}
                            className="text-[11px] font-label-bold bg-surface-container hover:bg-surface-container-high text-primary px-2.5 py-1 rounded-lg border border-border-subtle cursor-pointer outline-none transition-colors"
                          >
                            <option value="">+ Assign Role</option>
                            {unassignedRoles.map((r) => (
                              <option key={r.id || r.name} value={r.name}>
                                {r.name} {r.isSystem ? '(System)' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-md bg-surface-container-low border-t border-border-subtle flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* --- SUB-MODAL 1: ADD ROLE TO TEAM --- */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setIsAddRoleModalOpen(false)} />
          <div
            className="relative bg-card-bg rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-lg bg-surface-container-low border-b border-border-subtle flex items-center justify-between shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_moderator</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Add Role to {team.name}</h3>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">Select active platform role &amp; assign team members</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoleModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAddRole} className="p-lg flex flex-col gap-md overflow-y-auto flex-1">
              {/* Role Picker */}
              <div className="space-y-xs">
                <div className="flex items-center justify-between">
                  <label className="block font-label-bold text-label-sm text-on-surface">
                    Select Active Platform Role <span className="text-error">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-outline">
                    {allPlatformRoles.length} Available Roles
                  </span>
                </div>
                <select
                  value={newRoleSelection}
                  onChange={(e) => setNewRoleSelection(e.target.value)}
                  className="w-full h-11 px-md bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-inner"
                  required
                >
                  {allPlatformRoles.map((r) => {
                    const isAlreadyInTeam = teamRolesList.some((tr) => tr.name.toLowerCase() === r.name.toLowerCase());
                    return (
                      <option key={r.id || r.name} value={r.name}>
                        {r.name} ({r.isSystem ? 'SYSTEM' : 'CUSTOM'}) — {r.permissionKeys?.length || 8} Permissions {isAlreadyInTeam ? '• (In Team)' : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Role Details Preview Card */}
                {selectedRoleDetails && (
                  <div className="p-3 mt-1.5 bg-surface-container-low rounded-xl border border-border-subtle flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">
                      {selectedRoleDetails.isSystem ? 'shield' : 'verified_user'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-bold text-[12px] text-on-surface">{selectedRoleDetails.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                          selectedRoleDetails.isSystem ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {selectedRoleDetails.isSystem ? 'System Core Role' : 'Platform Role'}
                        </span>
                        <span className="text-[10px] text-outline font-mono">
                          {selectedRoleDetails.permissionKeys?.length || 8} Permissions
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                        {selectedRoleDetails.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Members Checklist */}
              <div className="space-y-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-bold text-label-sm text-on-surface">
                    Assign Team Members ({selectedMemberIdsForNewRole.size} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMemberIdsForNewRole.size === teamMembers.length) {
                        setSelectedMemberIdsForNewRole(new Set());
                      } else {
                        setSelectedMemberIdsForNewRole(new Set(teamMembers.map((m) => m.id)));
                      }
                    }}
                    className="text-[12px] font-label-bold text-primary hover:underline cursor-pointer"
                  >
                    {selectedMemberIdsForNewRole.size === teamMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">search</span>
                  <input
                    type="text"
                    placeholder="Filter members..."
                    value={memberSearchInAddModal}
                    onChange={(e) => setMemberSearchInAddModal(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 bg-surface-container-low rounded-md text-[12px] text-on-surface focus:outline-none mb-1.5"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto bg-surface-container-low rounded-xl p-xs space-y-1 border border-border-subtle">
                  {teamMembers.length === 0 ? (
                    <div className="p-md text-center text-outline text-[12px]">No members in this team.</div>
                  ) : (
                    teamMembers
                      .filter((m) => {
                        const q = memberSearchInAddModal.toLowerCase().trim();
                        return !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
                      })
                      .map((m) => {
                        const isChecked = selectedMemberIdsForNewRole.has(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-surface-container-lowest shadow-2xs' : 'hover:bg-surface-container'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedMemberIdsForNewRole((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(m.id)) next.delete(m.id);
                                    else next.add(m.id);
                                    return next;
                                  });
                                }}
                                className="rounded text-primary focus:ring-0 cursor-pointer"
                              />
                              <div className="truncate">
                                <span className="font-medium text-on-surface text-[12px] block truncate">{m.name}</span>
                                <span className="text-on-surface-variant text-[11px] block truncate">{m.email}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-outline shrink-0">
                              {(m.roles || ['Member']).join(', ')}
                            </span>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm mt-auto">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container shadow-sm cursor-pointer"
                >
                  Add Role &amp; Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 2: EDIT ROLE MEMBERS --- */}
      {editingRoleMembers && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setEditingRoleMembers(null)} />
          <div
            className="relative bg-card-bg rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-lg bg-surface-container-low border-b border-border-subtle flex items-center justify-between shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Manage &ldquo;{editingRoleMembers}&rdquo; Members
                  </h3>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">Team: {team.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoleMembers(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveRoleMembers} className="p-lg flex flex-col gap-md overflow-y-auto flex-1">
              <div className="space-y-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-bold text-label-sm text-on-surface">
                    Assigned Members ({memberIdsInRole.size} of {teamMembers.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (memberIdsInRole.size === teamMembers.length) {
                        setMemberIdsInRole(new Set());
                      } else {
                        setMemberIdsInRole(new Set(teamMembers.map((m) => m.id)));
                      }
                    }}
                    className="text-[12px] font-label-bold text-primary hover:underline cursor-pointer"
                  >
                    {memberIdsInRole.size === teamMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">search</span>
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={memberSearchInEditModal}
                    onChange={(e) => setMemberSearchInEditModal(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 bg-surface-container-low rounded-md text-[12px] text-on-surface focus:outline-none mb-1.5"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto bg-surface-container-low rounded-xl p-xs space-y-1 border border-border-subtle">
                  {teamMembers
                    .filter((m) => {
                      const q = memberSearchInEditModal.toLowerCase().trim();
                      return !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
                    })
                    .map((m) => {
                      const isChecked = memberIdsInRole.has(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-surface-container-lowest shadow-2xs' : 'hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setMemberIdsInRole((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(m.id)) next.delete(m.id);
                                  else next.add(m.id);
                                  return next;
                                });
                              }}
                              className="rounded text-primary focus:ring-0 cursor-pointer"
                            />
                            <div className="truncate">
                              <span className="font-medium text-on-surface text-[12px] block truncate">{m.name}</span>
                              <span className="text-on-surface-variant text-[11px] block truncate">{m.email}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-outline shrink-0">
                            {(m.roles || ['Member']).join(', ')}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm mt-auto">
                <button
                  type="button"
                  onClick={() => setEditingRoleMembers(null)}
                  className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container shadow-sm cursor-pointer"
                >
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 3: SAFE DELETE TEAM ROLE WITH ACTIVE MEMBERS --- */}
      {deletingRoleData && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setDeletingRoleData(null)} />
          <div
            className="relative bg-card-bg rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-lg bg-warning-bg/30 border-b border-warning-text/30 flex items-start gap-md shrink-0">
              <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning-text border border-warning-text/40 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="flex-1">
                <span className="px-2 py-0.5 rounded bg-warning-bg text-warning-text font-label-bold text-[10px] uppercase tracking-wider">
                  Active Members Safeguard
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface mt-0.5">
                  Delete Role &ldquo;{deletingRoleData.roleName}&rdquo; from {team.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingRoleData(null)}
                className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmSafeDeleteRole} className="p-lg space-y-md overflow-y-auto flex-1">
              <div className="p-sm rounded-xl bg-surface-container-low border border-border-subtle space-y-1 text-body-sm">
                <p className="text-on-surface font-semibold">
                  This role is currently assigned to {deletingRoleData.affectedMembers.length} active member(s) in {team.name}.
                </p>
                <p className="text-on-surface-variant text-[12px] leading-relaxed">
                  To ensure uninterrupted access and avoid leaving members without permissions, please select a replacement role to reassign them to.
                </p>
              </div>

              {/* Affected Members Preview */}
              <div className="space-y-xs">
                <span className="font-label-bold text-[12px] text-on-surface-variant">Affected Members:</span>
                <div className="max-h-32 overflow-y-auto bg-surface-container-low rounded-xl p-xs space-y-1 border border-border-subtle">
                  {deletingRoleData.affectedMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-[12px]">
                      <span className="font-medium text-on-surface">{m.name}</span>
                      <span className="text-on-surface-variant text-[11px]">{m.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replacement Role Selector */}
              <div className="space-y-xs">
                <label className="block font-label-bold text-label-sm text-on-surface">
                  Select Replacement Role <span className="text-error">*</span>
                </label>
                <select
                  value={deletingRoleData.replacementRole}
                  onChange={(e) =>
                    setDeletingRoleData((prev) => ({ ...prev, replacementRole: e.target.value }))
                  }
                  className="w-full h-11 px-md bg-surface-container-low rounded-xl text-body-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  required
                >
                  {replacementRoleOptions.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name} ({r.isSystem ? 'SYSTEM' : 'CUSTOM'}) {r.inTeam ? '• (In Team)' : '• (Platform Role)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm mt-auto">
                <button
                  type="button"
                  onClick={() => setDeletingRoleData(null)}
                  disabled={deleteLoading}
                  className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-md py-xs bg-error text-on-error font-label-bold text-label-sm rounded-lg hover:bg-error/90 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {deleteLoading ? (
                    <span>Reassigning &amp; Deleting...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      <span>Reassign &amp; Delete Role</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Member Onboarding Modal */}
      {isOnboardingOpen && (
        <TeamMemberOnboardingModal
          isOpen={isOnboardingOpen}
          team={team}
          availableRoles={allPlatformRoles}
          onClose={() => setIsOnboardingOpen(false)}
          onOnboardMembers={onUpdateTeamMembers}
          showToast={showToast}
        />
      )}
    </div>
  );
}
