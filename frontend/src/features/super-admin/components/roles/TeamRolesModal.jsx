import { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import TeamMemberOnboardingModal from './TeamMemberOnboardingModal.jsx';
import TeamRolesModalHeader from './TeamRolesModalHeader.jsx';
import TeamRolesToolbar from './TeamRolesToolbar.jsx';
import TeamRolesContent from './TeamRolesContent.jsx';
import TeamRoleAddModal from './TeamRoleAddModal.jsx';
import TeamRoleMembersEditModal from './TeamRoleMembersEditModal.jsx';
import TeamRoleSafeDeleteModal from './TeamRoleSafeDeleteModal.jsx';

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

  const allPlatformRoles = useMemo(() => {
    const rawList = fetchedRoles.length > 0 ? fetchedRoles : availableRoles;
    const map = new Map();

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

  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleSelection, setNewRoleSelection] = useState('');
  const [selectedMemberIdsForNewRole, setSelectedMemberIdsForNewRole] = useState(new Set());
  const [memberSearchInAddModal, setMemberSearchInAddModal] = useState('');

  const [editingRoleMembers, setEditingRoleMembers] = useState(null);
  const [memberIdsInRole, setMemberIdsInRole] = useState(new Set());
  const [memberSearchInEditModal, setMemberSearchInEditModal] = useState('');

  const [viewMode, setViewMode] = useState('roles');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [deletingRoleData, setDeletingRoleData] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const selectedRoleDetails = useMemo(() => {
    if (!newRoleSelection) return null;
    return allPlatformRoles.find((r) => r.name.toLowerCase() === newRoleSelection.toLowerCase()) || null;
  }, [newRoleSelection, allPlatformRoles]);

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

  const handleOpenAddRoleModal = () => {
    const existingRoleNames = new Set(teamRolesList.map((r) => r.name.toLowerCase()));
    const candidate = allPlatformRoles.find((r) => !existingRoleNames.has(r.name.toLowerCase())) || allPlatformRoles[0];
    setNewRoleSelection(candidate ? candidate.name : 'Developer');
    setSelectedMemberIdsForNewRole(new Set());
    setMemberSearchInAddModal('');
    setIsAddRoleModalOpen(true);
  };

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

  const handleOpenEditRoleMembers = (role) => {
    setEditingRoleMembers(role.name);
    const memberIds = new Set(role.members.map((m) => m.id));
    setMemberIdsInRole(memberIds);
    setMemberSearchInEditModal('');
  };

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

  const handleInitiateDeleteRole = (role) => {
    if (role.membersCount > 0) {
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
      const updatedMembers = teamMembers.map((m) => ({
        ...m,
        roles: (m.roles || ['Member']).filter((r) => r !== role.name),
      }));
      onUpdateTeamMembers(team.id, updatedMembers);
      showToast?.(`Removed role "${role.name}" from "${team.name}".`);
    }
  };

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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div
        className="relative bg-card-bg rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-border-subtle z-[1050] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <TeamRolesModalHeader
          team={team}
          roleCount={teamRolesList.length}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenAddRole={handleOpenAddRoleModal}
          onClose={onClose}
        />

        <TeamRolesToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          roleCount={teamRolesList.length}
          memberCount={teamMembers.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <TeamRolesContent
          viewMode={viewMode}
          filteredTeamRoles={filteredTeamRoles}
          filteredTeamMembers={filteredTeamMembers}
          allPlatformRoles={allPlatformRoles}
          onOpenAddRole={handleOpenAddRoleModal}
          onOpenEditRoleMembers={handleOpenEditRoleMembers}
          onInitiateDeleteRole={handleInitiateDeleteRole}
          onAddRoleToMember={handleAddRoleToMember}
          onRemoveRoleFromMember={handleRemoveRoleFromMember}
        />

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

      {isAddRoleModalOpen && (
        <TeamRoleAddModal
          team={team}
          allPlatformRoles={allPlatformRoles}
          teamRolesList={teamRolesList}
          teamMembers={teamMembers}
          selectedRoleDetails={selectedRoleDetails}
          roleSelection={newRoleSelection}
          onRoleSelectionChange={setNewRoleSelection}
          selectedMemberIds={selectedMemberIdsForNewRole}
          onSelectedMemberIdsChange={setSelectedMemberIdsForNewRole}
          memberSearch={memberSearchInAddModal}
          onMemberSearchChange={setMemberSearchInAddModal}
          onClose={() => setIsAddRoleModalOpen(false)}
          onSubmit={handleConfirmAddRole}
        />
      )}

      {editingRoleMembers && (
        <TeamRoleMembersEditModal
          team={team}
          roleName={editingRoleMembers}
          teamMembers={teamMembers}
          selectedMemberIds={memberIdsInRole}
          onSelectedMemberIdsChange={setMemberIdsInRole}
          search={memberSearchInEditModal}
          onSearchChange={setMemberSearchInEditModal}
          onClose={() => setEditingRoleMembers(null)}
          onSubmit={handleSaveRoleMembers}
        />
      )}

      {deletingRoleData && (
        <TeamRoleSafeDeleteModal
          team={team}
          data={deletingRoleData}
          replacementRoleOptions={replacementRoleOptions}
          loading={deleteLoading}
          onChangeData={setDeletingRoleData}
          onClose={() => setDeletingRoleData(null)}
          onSubmit={handleConfirmSafeDeleteRole}
        />
      )}
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
