import Toast from '../../../components/shared/Toast.jsx';
import TeamRolesModal from './roles/TeamRolesModal.jsx';
import TeamMemberOnboardingModal from './roles/TeamMemberOnboardingModal.jsx';
import { useTeamsManagement } from './teams/useTeamsManagement.js';
import TeamsTable from './teams/TeamsTable.jsx';
import TeamCardGrid from './teams/TeamCardGrid.jsx';
import TeamMembersDrawer from './teams/TeamMembersDrawer.jsx';
import TeamCreateEditModal from './teams/TeamCreateEditModal.jsx';
import RoleRemovalSafeguardModal from './teams/RoleRemovalSafeguardModal.jsx';

export default function TeamsView({ onJumpIntoWorkspace, createTrigger }) {
  const {
    loading,
    searchQuery,
    activeFilter,
    viewMode,
    filterTabs,
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
  } = useTeamsManagement({ createTrigger });

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
        <TeamsTable
          loading={loading}
          paginatedTeams={paginatedTeams}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          safeCurrentPage={safeCurrentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onSelectTeamForMembers={setSelectedTeamForMembers}
          onSelectTeamForRoles={setSelectedTeamForRoles}
          onSelectTeamForOnboarding={setTeamForOnboarding}
          onOpenEditModal={handleOpenEditModal}
          onToggleArchive={handleToggleArchive}
          onJumpIntoWorkspace={onJumpIntoWorkspace}
        />
      ) : (
        <TeamCardGrid
          paginatedTeams={paginatedTeams}
          onSelectTeamForMembers={setSelectedTeamForMembers}
          onSelectTeamForRoles={setSelectedTeamForRoles}
          onSelectTeamForOnboarding={setTeamForOnboarding}
          onOpenEditModal={handleOpenEditModal}
          onToggleArchive={handleToggleArchive}
          onJumpIntoWorkspace={onJumpIntoWorkspace}
        />
      )}

      {/* Slide-over Members Modal */}
      <TeamMembersDrawer
        selectedTeamForMembers={selectedTeamForMembers}
        onClose={() => setSelectedTeamForMembers(null)}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        onAddMemberRole={handleAddMemberRole}
        onInitiateRemoveMemberRole={handleInitiateRemoveMemberRole}
        availableRoles={availableRoles}
        onOpenOnboarding={setTeamForOnboarding}
      />

      {/* Create / Edit Team Modal */}
      <TeamCreateEditModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        editingTeam={editingTeam}
        modalTab={modalTab}
        setModalTab={setModalTab}
        teamForm={teamForm}
        setTeamForm={setTeamForm}
        formSubmitting={formSubmitting}
        onSaveTeam={handleSaveTeam}
        availableRoles={availableRoles}
        createSelectedRoles={createSelectedRoles}
        onToggleCreateRole={handleToggleCreateRole}
        onSelectAllCreateRoles={handleSelectAllCreateRoles}
        enabledRolesForCreate={enabledRolesForCreate}
        createMemberSearch={createMemberSearch}
        setCreateMemberSearch={setCreateMemberSearch}
        createDefaultRole={createDefaultRole}
        setCreateDefaultRole={setCreateDefaultRole}
        createSelectedUsers={createSelectedUsers}
        onSelectAllCreateUsers={handleSelectAllCreateUsers}
        activePlatformUsers={activePlatformUsers}
        loadingPlatformUsers={loadingPlatformUsers}
        onToggleCreateUser={handleToggleCreateUser}
        createRoleOverrides={createRoleOverrides}
        setCreateRoleOverrides={setCreateRoleOverrides}
        onAddMemberRole={handleAddMemberRole}
        onInitiateRemoveMemberRole={handleInitiateRemoveMemberRole}
      />

      {/* Role Removal Safeguard Modal */}
      <RoleRemovalSafeguardModal
        roleRemovalData={roleRemovalData}
        onClose={() => setRoleRemovalData(null)}
        availableRoles={availableRoles}
        roleRemovalLoading={roleRemovalLoading}
        onConfirmReassignment={handleConfirmMemberRoleReassignment}
        setRoleRemovalData={setRoleRemovalData}
      />

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
