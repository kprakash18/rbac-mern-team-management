import DefaultRoleBar from './onboarding/DefaultRoleBar';
import OnboardingFooter from './onboarding/OnboardingFooter';
import OnboardingShell from './onboarding/OnboardingShell';
import OnboardingToolbar from './onboarding/OnboardingToolbar';
import OnboardingUsersList from './onboarding/OnboardingUsersList';
import { useTeamMemberOnboarding } from './onboarding/useTeamMemberOnboarding';

export default function TeamMemberOnboardingModal({
  isOpen,
  team,
  availableRoles = [],
  onClose,
  onOnboardMembers,
  showToast,
}) {
  const onboarding = useTeamMemberOnboarding({
    isOpen,
    team,
    onClose,
    onOnboardMembers,
    showToast,
  });

  if (!isOpen || !team) return null;

  return (
    <OnboardingShell
      team={team}
      onClose={onClose}
      footer={(
        <OnboardingFooter
          selectedCount={onboarding.selectedUserIds.size}
          submitting={onboarding.submitting}
          onClose={onClose}
          onSubmit={onboarding.handleSubmitOnboarding}
        />
      )}
    >
      <OnboardingToolbar
        activeCount={onboarding.activeUsers.length}
        assignedCount={onboarding.assignedCount}
        availableCount={onboarding.availableCount}
        filterTab={onboarding.filterTab}
        searchQuery={onboarding.searchQuery}
        setFilterTab={onboarding.setFilterTab}
        setSearchQuery={onboarding.setSearchQuery}
      />

      <DefaultRoleBar
        availableCount={onboarding.availableCount}
        availableRoles={availableRoles}
        filterTab={onboarding.filterTab}
        selectedRole={onboarding.selectedRole}
        selectedUserIds={onboarding.selectedUserIds}
        onSelectAll={onboarding.handleSelectAllAvailable}
        onSelectedRoleChange={onboarding.setSelectedRole}
      />

      <OnboardingUsersList
        availableRoles={availableRoles}
        filteredUsers={onboarding.filteredUsers}
        loadingUsers={onboarding.loadingUsers}
        selectedRole={onboarding.selectedRole}
        selectedUserIds={onboarding.selectedUserIds}
        userRoleOverrides={onboarding.userRoleOverrides}
        onSetUserRole={onboarding.handleSetUserRole}
        onToggleUser={onboarding.handleToggleUser}
      />
    </OnboardingShell>
  );
}
