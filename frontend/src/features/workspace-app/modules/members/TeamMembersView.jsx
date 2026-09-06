import { useApp } from '@/context/useApp';
import { useWorkspace } from '@/context/useWorkspace';
import { useTeamMembers } from './useTeamMembers';
import MemberListTable from './components/MemberListTable';
import MemberCardGrid from './components/MemberCardGrid';
import InvitationsTable from './components/InvitationsTable';
import MemberProfileDrawer from './components/MemberProfileDrawer';
import InviteTeamMemberModal from './InviteTeamMemberModal';
import ManageMemberRoleModal from './ManageMemberRoleModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Toast from '@/components/shared/Toast';
import SearchInput from '@/components/shared/SearchInput';

const ROLES_FILTER_OPTIONS = [
  'All Roles',
  'Team Admin',
  'Developer',
  'Viewer',
  'Security Auditor',
];

export default function TeamMembersView({ currentUser, workspace, onOpenDirectMessage }) {
  const { activeWorkspace } = useApp();
  const { isTeamAdmin } = useWorkspace();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;

  const {
    members,
    pendingInvitations,
    filteredMembers,
    filteredInvitations,
    loading,
    activeMainTab,
    setActiveMainTab,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    selectedMember,
    isDrawerOpen,
    handleOpenMember,
    handleCloseDrawer,
    isInviteModalOpen,
    setIsInviteModalOpen,
    confirmRevokeInvite,
    setConfirmRevokeInvite,
    confirmRemovalMember,
    setConfirmRemovalMember,
    confirmSuspendMember,
    setConfirmSuspendMember,
    roleEditingMember,
    setRoleEditingMember,
    toast,
    canInvite,
    canManageRoles,
    canManageMembers,
    handleToggleSuspendMember,
    handleConfirmRemoveMember,
    handleSaveMemberRole,
    handleConfirmRevokeInvite,
    handleCreateInvite,
  } = useTeamMembers(teamId);

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            Team &amp; Members
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {members.length} active team members in {activeWorkspace?.name || 'this workspace'}
          </p>
        </div>

        <div className="flex items-center gap-sm">
          {canInvite ? (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="px-md py-2 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:opacity-90 shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Invite Member</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-xs px-md py-2 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm opacity-60 cursor-not-allowed border border-border-subtle select-none"
              title="Restricted: Only Team Admins can invite new members to this workspace."
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>+ Invite Member</span>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast message={toast?.msg} type={toast?.type} />

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-label-sm font-label-bold transition-colors cursor-pointer ${
            activeMainTab === 'members'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>Active Members</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeMainTab === 'members'
                ? 'bg-on-primary/20 text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('invitations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-label-sm font-label-bold transition-colors cursor-pointer ${
            activeMainTab === 'invitations'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">mail</span>
          <span>Pending Invitations</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeMainTab === 'invitations'
                ? 'bg-on-primary/20 text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {pendingInvitations.length}
          </span>
        </button>
      </div>

      {activeMainTab === 'invitations' ? (
        <InvitationsTable
          invitations={filteredInvitations}
          totalCount={pendingInvitations.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          canInvite={canInvite}
          onOpenInviteModal={() => setIsInviteModalOpen(true)}
          onRevokeInvite={(inv) => setConfirmRevokeInvite(inv)}
        />
      ) : (
        <>
          {/* Clean Filter & Search Bar */}
          <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search by name, email, or role..."
                className="flex-1 min-w-50 max-w-md"
              />

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-label-sm font-label-sm bg-surface-container-low border border-border-subtle rounded-lg px-3 py-1.5 text-on-surface cursor-pointer focus:border-primary outline-none"
              >
                {ROLES_FILTER_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
                {['All', 'Active', 'Suspended', 'On-Call'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                      statusFilter === tab
                        ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* View Mode */}
              <div className="flex items-center border border-border-subtle rounded-lg overflow-hidden bg-surface-container-low">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 border-r border-border-subtle cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-surface-container-lowest text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                  title="Grid View"
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-surface-container-lowest text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                  title="Table View"
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                </button>
              </div>
            </div>
          </div>

          {/* Members Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-border-subtle">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
              <span className="text-[13px] font-medium">Loading team members...</span>
            </div>
          ) : viewMode === 'grid' ? (
            <MemberCardGrid
              members={filteredMembers}
              currentUserId={currentUserId}
              canManageRoles={canManageRoles}
              onOpenMember={handleOpenMember}
              onOpenDirectMessage={onOpenDirectMessage}
            />
          ) : (
            <MemberListTable
              members={filteredMembers}
              currentUserId={currentUserId}
              canManageRoles={canManageRoles}
              canManageMembers={canManageMembers}
              onOpenMember={handleOpenMember}
              onRemoveMember={(member) => setConfirmRemovalMember(member)}
              onSuspendMember={(member) => setConfirmSuspendMember(member)}
              onOpenDirectMessage={onOpenDirectMessage}
            />
          )}
        </>
      )}

      {/* Member Profile Slide-over Drawer */}
      <MemberProfileDrawer
        isOpen={isDrawerOpen}
        member={selectedMember}
        currentUserId={currentUserId}
        isTeamAdmin={isTeamAdmin}
        onClose={handleCloseDrawer}
        onOpenDirectMessage={onOpenDirectMessage}
        onStartRoleEdit={(member) => setRoleEditingMember(member)}
        onToggleSuspend={handleToggleSuspendMember}
        onStartRemove={(member) => setConfirmRemovalMember(member)}
      />

      {/* Confirm Revoke Invite Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmRevokeInvite)}
        title="Revoke Invitation?"
        description={`Are you sure you want to revoke the invitation for ${confirmRevokeInvite?.email}? The invitation link will immediately expire and be invalidated.`}
        confirmText="Yes, Revoke Invitation"
        cancelText="Keep Active"
        confirmVariant="danger"
        icon="cancel"
        onConfirm={() => handleConfirmRevokeInvite(confirmRevokeInvite.id)}
        onClose={() => setConfirmRevokeInvite(null)}
      />

      {/* Confirm Removal Member Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmRemovalMember)}
        title={`Remove ${confirmRemovalMember?.name}?`}
        description={`Are you sure you want to remove ${confirmRemovalMember?.name} from this workspace? They will immediately lose access to all tasks, channels, and team resources.`}
        confirmText="Yes, Remove Member"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="warning"
        onConfirm={() => handleConfirmRemoveMember(confirmRemovalMember.id)}
        onClose={() => setConfirmRemovalMember(null)}
      />

      {/* Confirm Suspend / Reactivate Member Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmSuspendMember)}
        title={confirmSuspendMember?.status === 'Suspended' ? `Reactivate ${confirmSuspendMember?.name}?` : `Suspend ${confirmSuspendMember?.name}?`}
        description={
          confirmSuspendMember?.status === 'Suspended'
            ? `This will reactivate ${confirmSuspendMember?.name}'s membership, restoring their permissions and access to workspace tasks, team channels, and access requests.`
            : `Are you sure you want to suspend ${confirmSuspendMember?.name}? While suspended, the member's account access is temporarily frozen and they cannot perform any mutations or access sensitive resources.`
        }
        confirmText={confirmSuspendMember?.status === 'Suspended' ? 'Yes, Reactivate Member' : 'Yes, Suspend Access'}
        cancelText="Cancel"
        confirmVariant={confirmSuspendMember?.status === 'Suspended' ? 'primary' : 'warning'}
        icon={confirmSuspendMember?.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
        onConfirm={() => {
          handleToggleSuspendMember(confirmSuspendMember.id);
          setConfirmSuspendMember(null);
        }}
        onClose={() => setConfirmSuspendMember(null)}
      />

      {/* Invite Member Modal */}
      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleCreateInvite}
      />

      {/* Manage Member Role Modal */}
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
