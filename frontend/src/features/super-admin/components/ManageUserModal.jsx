import AccountStatusSection from './manage-user/AccountStatusSection';
import ManageUserConfirmModal from './manage-user/ManageUserConfirmModal';
import ManageUserFooter from './manage-user/ManageUserFooter';
import ManageUserShell from './manage-user/ManageUserShell';
import { PlatformAuthoritySection, SessionSecuritySection } from './manage-user/SecuritySections';
import UserProfileSummary from './manage-user/UserProfileSummary';
import WorkspaceAccessSection from './manage-user/WorkspaceAccessSection';
import { useManageUserForm } from './manage-user/useManageUserForm';

export default function ManageUserModal({ isOpen, user, onClose, onSaveUser }) {
  const form = useManageUserForm({ isOpen, onClose, onSaveUser, user });

  if (!isOpen || !user) return null;

  return (
    <>
      <ManageUserShell onClose={onClose} user={user}>
        <div className="flex flex-col flex-1 overflow-y-auto p-lg gap-xl">
          <UserProfileSummary
            accountStatus={form.accountStatus}
            isSuperAdmin={form.isSuperAdmin}
            user={user}
          />

          <AccountStatusSection
            accountStatus={form.accountStatus}
            onStatusChange={form.handleStatusChangeRequest}
          />

          <WorkspaceAccessSection
            availableRoleNames={form.availableRoleNames}
            workspaceOptions={form.workspaceOptions}
            workspaces={form.workspaces}
            onAddWorkspace={form.handleAddWorkspace}
            onRemoveWorkspace={form.handleRemoveWorkspaceRequest}
            onRoleChange={form.handleRoleChange}
            onToggleTeamAdmin={form.handleToggleTeamAdmin}
            onWorkspaceChange={form.handleWorkspaceChange}
          />

          <PlatformAuthoritySection
            isSuperAdmin={form.isSuperAdmin}
            onChange={form.setIsSuperAdmin}
          />

          <SessionSecuritySection
            mustChangePassword={form.mustChangePassword}
            sessionsTerminated={form.sessionsTerminated}
            onForceLogout={() => form.setSessionsTerminated(true)}
            onPasswordResetChange={form.setMustChangePassword}
          />
        </div>

        <ManageUserFooter onClose={onClose} onSave={form.handleSave} />
      </ManageUserShell>

      <ManageUserConfirmModal
        confirmModal={form.confirmModal}
        onClose={() => form.setConfirmModal(null)}
      />
    </>
  );
}
