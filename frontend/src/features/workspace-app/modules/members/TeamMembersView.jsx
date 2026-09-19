import { memo } from 'react';
import InviteTeamMemberModal from './InviteTeamMemberModal';
import ManageMemberRoleModal from './ManageMemberRoleModal';
import InvitationsPanel from './components/InvitationsPanel';
import MemberDetailsDrawer from './components/MemberDetailsDrawer';
import MemberFilters from './components/MemberFilters';
import MembersDirectory from './components/MembersDirectory';
import TeamMemberConfirmModals from './components/TeamMemberConfirmModals';
import TeamMembersHeader from './components/TeamMembersHeader';
import TeamMembersTabs from './components/TeamMembersTabs';
import { useTeamMembersDirectory } from './hooks/useTeamMembersDirectory';
import { Toast } from '@/shared/components';

function TeamMembersView({ currentUser, workspace, onOpenDirectMessage }) {
  const directory = useTeamMembersDirectory({ currentUser, workspace });
  const {
    activeTab,
    confirmRemovalMember,
    confirmRevokeInvite,
    confirmSuspendMember,
    currentPage,
    currentUserId,
    filteredInvitations,
    filteredMembers,
    isDrawerOpen,
    isInviteModalOpen,
    isMembersLoading,
    pageSize,
    pendingInvitations,
    permissions,
    roleEditingMember,
    searchQuery,
    selectedMember,
    selectedRole,
    statusFilter,
    teamId,
    toast,
    totalMembers,
    totalPages,
    viewMode,
    handleConfirmRemoveMember,
    handleConfirmRevokeInvite,
    handleCreateInvite,
    handleSaveMemberRole,
    handleToggleSuspendMember,
    openMemberDrawer,
    setActiveTab,
    setConfirmRemovalMember,
    setConfirmRevokeInvite,
    setConfirmSuspendMember,
    setCurrentPage,
    setIsDrawerOpen,
    setIsInviteModalOpen,
    setRoleEditingMember,
    setSearchQuery,
    setSelectedRole,
    setStatusFilter,
    setViewMode,
  } = directory;

  const memberActions = {
    canAssignRole: permissions.canAssignRole,
    canManageMembership: permissions.canManageMembership,
    onDirectMessage: onOpenDirectMessage,
    onEditRole: setRoleEditingMember,
    onSuspend: setConfirmSuspendMember,
  };

  const handleStatusConfirm = (memberId) => {
    handleToggleSuspendMember(memberId);
    setConfirmSuspendMember(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      <TeamMembersHeader
        canInvite={permissions.canInvite}
        totalMembers={totalMembers}
        onInvite={() => setIsInviteModalOpen(true)}
      />

      <Toast message={toast?.msg} type={toast?.type} />

      <TeamMembersTabs
        activeTab={activeTab}
        invitationCount={pendingInvitations.length}
        memberCount={totalMembers}
        onTabChange={setActiveTab}
      />

      {activeTab === 'invitations' ? (
        <InvitationsPanel
          canInvite={permissions.canInvite}
          canRevokeInvite={permissions.canRevokeInvite}
          invitations={filteredInvitations}
          searchQuery={searchQuery}
          onInvite={() => setIsInviteModalOpen(true)}
          onRevoke={setConfirmRevokeInvite}
          onSearchChange={(event) => setSearchQuery(event.target.value)}
        />
      ) : (
        <>
          <MemberFilters
            searchQuery={searchQuery}
            selectedRole={selectedRole}
            statusFilter={statusFilter}
            viewMode={viewMode}
            onRoleChange={(event) => {
              setSelectedRole(event.target.value);
              setCurrentPage(1);
            }}
            onSearchChange={(event) => setSearchQuery(event.target.value)}
            onStatusChange={(status) => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            onViewModeChange={setViewMode}
          />

          <MembersDirectory
            actions={memberActions}
            currentPage={currentPage}
            currentUserId={currentUserId}
            isLoading={isMembersLoading}
            members={filteredMembers}
            pageSize={pageSize}
            totalMembers={totalMembers}
            totalPages={totalPages}
            viewMode={viewMode}
            onPageChange={setCurrentPage}
            onSelectMember={openMemberDrawer}
          />
        </>
      )}

      {isDrawerOpen && (
        <MemberDetailsDrawer
          canAssignRole={permissions.canAssignRole}
          canManageMembership={permissions.canManageMembership}
          canRemoveMember={permissions.canRemoveMember}
          currentUserId={currentUserId}
          member={selectedMember}
          onClose={() => setIsDrawerOpen(false)}
          onDirectMessage={onOpenDirectMessage}
          onEditRole={setRoleEditingMember}
          onRemove={setConfirmRemovalMember}
          onToggleSuspend={handleToggleSuspendMember}
        />
      )}

      <TeamMemberConfirmModals
        confirmRemovalMember={confirmRemovalMember}
        confirmRevokeInvite={confirmRevokeInvite}
        confirmSuspendMember={confirmSuspendMember}
        onCloseRemoval={() => setConfirmRemovalMember(null)}
        onCloseRevoke={() => setConfirmRevokeInvite(null)}
        onCloseSuspend={() => setConfirmSuspendMember(null)}
        onConfirmRemoval={handleConfirmRemoveMember}
        onConfirmRevoke={handleConfirmRevokeInvite}
        onConfirmSuspend={handleStatusConfirm}
      />

      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleCreateInvite}
      />

      {roleEditingMember && (
        <ManageMemberRoleModal
          isOpen={Boolean(roleEditingMember)}
          member={roleEditingMember}
          teamId={teamId}
          onClose={() => setRoleEditingMember(null)}
          onSaveRole={handleSaveMemberRole}
        />
      )}
    </div>
  );
}

export default memo(TeamMembersView);
