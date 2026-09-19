import { useState, useEffect, useCallback } from 'react';
import { Toast } from '@/shared/components';
import { useToast } from '../../../lib/useToast.js';
import TeamRolesModal from './roles/TeamRolesModal.jsx';
import TeamMemberOnboardingModal from './roles/TeamMemberOnboardingModal.jsx';
import TeamsDirectorySection from './teams/TeamsDirectorySection.jsx';
import TeamMembersDrawer from './teams/TeamMembersDrawer.jsx';
import RoleRemovalSafeguardModal from './teams/RoleRemovalSafeguardModal.jsx';
import TeamWorkspaceModalFlow from './teams/TeamWorkspaceModalFlow.jsx';
import { useTeamsDirectory } from '../hooks/useTeamsDirectory.js';
import { useTeamMembersDrawer } from '../hooks/useTeamMembersDrawer.js';
import { useTeamWorkspaceEditor } from '../hooks/useTeamWorkspaceEditor.js';
import { useTeamRoleMutations } from '../hooks/useTeamRoleMutations.js';
import * as teamsApi from '../api/teamsApi.js';

export default function TeamsView({ onJumpIntoWorkspace, createTrigger }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedTeamForRoles, setSelectedTeamForRoles] = useState(null);
  const [teamForOnboarding, setTeamForOnboarding] = useState(null);

  const [toast, showToast] = useToast(3500);
  const directory = useTeamsDirectory(teams, pageSize);
  const membersDrawer = useTeamMembersDrawer();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const { teams: nextTeams, roles } = await teamsApi.getTeamsAndRoles();
      setAvailableRoles(roles);
      setTeams(nextTeams);
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
  const workspaceEditor = useTeamWorkspaceEditor({
    availableRoles,
    onSaved: fetchTeams,
    showToast,
  });
  const { openCreateModal } = workspaceEditor;

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      openCreateModal();
    }
  }, [createTrigger, openCreateModal]);

  const roleMutations = useTeamRoleMutations({
    availableRoles,
    membersDrawer,
    selectedTeamForRoles,
    setSelectedTeamForRoles,
    setTeams,
    workspaceEditor,
    showToast,
  });

  const handleToggleArchive = async (team) => {
    const isArchived = team.status === 'Archived';
    try {
      if (isArchived) {
        await teamsApi.restoreTeam(team.id);
        showToast(`Team "${team.name}" restored to Active.`);
      } else {
        await teamsApi.archiveTeam(team.id);
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
      <div className="fixed top-6 right-6 z-1200">
        <Toast message={toast?.msg} type={toast?.type} />
      </div>

      <div className="flex flex-col space-y-xs">
        <h1 className="font-display-title text-display-title text-on-surface">Teams &amp; Workspaces</h1>
        <p className="font-body-base text-body-base text-on-surface-variant">
          Global workspace namespaces, team allocations, and operational settings.
        </p>
      </div>

      <TeamsDirectorySection
        teams={directory.paginatedTeams}
        loading={loading}
        searchQuery={directory.searchQuery}
        onSearchChange={directory.handleSearchChange}
        filterTabs={filterTabs}
        activeFilter={directory.activeFilter}
        onFilterChange={directory.handleFilterChange}
        viewMode={directory.viewMode}
        onViewModeChange={directory.setViewMode}
        onCreateTeam={workspaceEditor.openCreateModal}
        page={directory.currentPage}
        totalPages={directory.totalPages}
        total={directory.totalItems}
        limit={directory.pageSize}
        onPageChange={directory.setCurrentPage}
        onOpenMembers={membersDrawer.openDrawer}
        onOnboard={setTeamForOnboarding}
        onManageRoles={setSelectedTeamForRoles}
        onEdit={workspaceEditor.openEditModal}
        onToggleArchive={handleToggleArchive}
        onJumpIntoWorkspace={onJumpIntoWorkspace}
      />

      <TeamMembersDrawer
        team={membersDrawer.selectedTeam}
        loading={membersDrawer.loading}
        searchQuery={membersDrawer.searchQuery}
        onSearchChange={membersDrawer.setSearchQuery}
        availableRoles={availableRoles}
        page={membersDrawer.page}
        totalPages={membersDrawer.totalPages}
        total={membersDrawer.total}
        limit={membersDrawer.pageSize}
        onPageChange={membersDrawer.setPage}
        onClose={membersDrawer.closeDrawer}
        onOnboard={setTeamForOnboarding}
        onAddRole={roleMutations.addMemberRole}
        onRemoveRole={roleMutations.initiateRemoveMemberRole}
      />

      <TeamWorkspaceModalFlow
        isOpen={workspaceEditor.isOpen}
        editingTeam={workspaceEditor.editingTeam}
        activeTab={workspaceEditor.activeTab}
        onTabChange={workspaceEditor.setActiveTab}
        availableRoles={availableRoles}
        teamForm={workspaceEditor.teamForm}
        onTeamFormChange={workspaceEditor.updateTeamForm}
        formSubmitting={workspaceEditor.formSubmitting}
        onSaveTeam={workspaceEditor.saveTeam}
        onClose={workspaceEditor.closeModal}
        createSelectedRoles={workspaceEditor.selectedRoles}
        onToggleCreateRole={workspaceEditor.toggleCreateRole}
        onSelectAllCreateRoles={workspaceEditor.selectAllCreateRoles}
        activePlatformUsers={workspaceEditor.activePlatformUsers}
        loadingPlatformUsers={workspaceEditor.loadingPlatformUsers}
        createMemberSearch={workspaceEditor.memberSearch}
        onCreateMemberSearchChange={workspaceEditor.setMemberSearch}
        createDefaultRole={workspaceEditor.defaultRole}
        onCreateDefaultRoleChange={workspaceEditor.setDefaultRole}
        enabledRolesForCreate={workspaceEditor.enabledRolesForCreate}
        createSelectedUsers={workspaceEditor.selectedUsers}
        createRoleOverrides={workspaceEditor.roleOverrides}
        onToggleCreateUser={workspaceEditor.toggleCreateUser}
        onSelectAllCreateUsers={workspaceEditor.selectAllCreateUsers}
        onCreateRoleOverrideChange={workspaceEditor.setRoleOverride}
        onAddMemberRole={roleMutations.addMemberRole}
        onRemoveMemberRole={roleMutations.initiateRemoveMemberRole}
      />

      <RoleRemovalSafeguardModal
        data={roleMutations.roleRemovalData}
        availableRoles={availableRoles}
        loading={roleMutations.roleRemovalLoading}
        onChangeReplacement={(replacementRole) =>
          roleMutations.setRoleRemovalData((prev) => ({ ...prev, replacementRole }))
        }
        onCancel={() => roleMutations.setRoleRemovalData(null)}
        onSubmit={roleMutations.confirmMemberRoleReassignment}
      />

      {selectedTeamForRoles && (
        <TeamRolesModal
          isOpen={Boolean(selectedTeamForRoles)}
          team={selectedTeamForRoles}
          availableRoles={availableRoles}
          onClose={() => setSelectedTeamForRoles(null)}
          onUpdateTeamMembers={roleMutations.updateTeamMembers}
          showToast={showToast}
        />
      )}

      {teamForOnboarding && (
        <TeamMemberOnboardingModal
          isOpen={Boolean(teamForOnboarding)}
          team={teamForOnboarding}
          availableRoles={availableRoles}
          onClose={() => setTeamForOnboarding(null)}
          onOnboardMembers={roleMutations.updateTeamMembers}
          showToast={showToast}
        />
      )}
    </div>
  );
}
