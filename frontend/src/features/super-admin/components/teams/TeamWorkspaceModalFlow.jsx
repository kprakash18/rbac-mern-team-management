import TeamWorkspaceModal from './TeamWorkspaceModal.jsx';
import TeamGeneralStep from './TeamGeneralStep.jsx';
import TeamEditRolesStep from './TeamEditRolesStep.jsx';
import TeamCreateRolesStep from './TeamCreateRolesStep.jsx';
import TeamCreateMembersStep from './TeamCreateMembersStep.jsx';

export default function TeamWorkspaceModalFlow({
  isOpen,
  editingTeam,
  activeTab,
  onTabChange,
  availableRoles,
  teamForm,
  onTeamFormChange,
  formSubmitting,
  onSaveTeam,
  onClose,
  createSelectedRoles,
  onToggleCreateRole,
  onSelectAllCreateRoles,
  activePlatformUsers,
  loadingPlatformUsers,
  createMemberSearch,
  onCreateMemberSearchChange,
  createDefaultRole,
  onCreateDefaultRoleChange,
  enabledRolesForCreate,
  createSelectedUsers,
  createRoleOverrides,
  onToggleCreateUser,
  onSelectAllCreateUsers,
  onCreateRoleOverrideChange,
  onAddMemberRole,
  onRemoveMemberRole,
}) {
  return (
    <TeamWorkspaceModal
      isOpen={isOpen}
      editingTeam={editingTeam}
      activeTab={activeTab}
      onTabChange={onTabChange}
      availableRoleCount={availableRoles.length}
      selectedUserCount={createSelectedUsers.size}
      onClose={onClose}
    >
      {activeTab === 'general' && (
        <TeamGeneralStep
          teamForm={teamForm}
          editingTeam={editingTeam}
          selectedMemberCount={createSelectedUsers.size}
          formSubmitting={formSubmitting}
          onFormChange={onTeamFormChange}
          onCancel={onClose}
          onNext={() => onTabChange('roles')}
          onSave={onSaveTeam}
        />
      )}

      {activeTab === 'roles' && (
        editingTeam ? (
          <TeamEditRolesStep
            team={editingTeam}
            availableRoles={availableRoles}
            onAddMemberRole={onAddMemberRole}
            onRemoveMemberRole={onRemoveMemberRole}
            onDone={onClose}
          />
        ) : (
          <TeamCreateRolesStep
            availableRoles={availableRoles}
            selectedRoles={createSelectedRoles}
            formSubmitting={formSubmitting}
            teamName={teamForm.name}
            onToggleRole={onToggleCreateRole}
            onSelectAllRoles={onSelectAllCreateRoles}
            onBack={() => onTabChange('general')}
            onNext={() => onTabChange('members')}
            onSave={onSaveTeam}
          />
        )
      )}

      {activeTab === 'members' && !editingTeam && (
        <TeamCreateMembersStep
          users={activePlatformUsers}
          loading={loadingPlatformUsers}
          search={createMemberSearch}
          onSearchChange={onCreateMemberSearchChange}
          defaultRole={createDefaultRole}
          onDefaultRoleChange={onCreateDefaultRoleChange}
          enabledRoles={enabledRolesForCreate}
          selectedUsers={createSelectedUsers}
          roleOverrides={createRoleOverrides}
          onToggleUser={onToggleCreateUser}
          onSelectAllUsers={onSelectAllCreateUsers}
          onRoleOverrideChange={onCreateRoleOverrideChange}
          onBack={() => onTabChange('roles')}
          onCancel={onClose}
          onSave={onSaveTeam}
          formSubmitting={formSubmitting}
          canSave={Boolean(teamForm.name.trim())}
        />
      )}
    </TeamWorkspaceModal>
  );
}
