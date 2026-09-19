import CreateUserAssignmentsSection from './create-user/CreateUserAssignmentsSection';
import CreateUserAuthoritySection from './create-user/CreateUserAuthoritySection';
import CreateUserIdentitySection from './create-user/CreateUserIdentitySection';
import CreateUserModalFrame from './create-user/CreateUserModalFrame';
import { useCreateUserForm } from './create-user/useCreateUserForm';

export default function CreateUserModal({ isOpen, onClose, onInvite, existingUsers = [] }) {
  const form = useCreateUserForm({ existingUsers, isOpen, onClose, onInvite });

  if (!isOpen) return null;

  return (
    <CreateUserModalFrame
      onClose={form.handleClose}
      footer={(
        <div className="p-lg border-t border-border-subtle flex items-center justify-end gap-sm bg-surface-container-low rounded-b-xl">
          <button
            type="button"
            onClick={form.handleClose}
            className="px-md h-10 rounded-lg font-label-bold text-label-sm text-on-surface border border-border-subtle bg-surface-container-lowest hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={form.handleSubmit}
            className="px-md h-10 rounded-lg font-label-bold text-label-sm text-on-primary bg-primary hover:opacity-90 transition-opacity flex items-center gap-xs shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span> Send Invite &amp; Assign
          </button>
        </div>
      )}
    >
      <CreateUserIdentitySection
        email={form.email}
        fullName={form.fullName}
        isExistingUser={form.isExistingUser}
        onEmailChange={form.handleEmailChange}
        onFullNameChange={form.setFullName}
      />

      <div className="h-px bg-border-subtle w-full"></div>

      <CreateUserAssignmentsSection
        assignments={form.assignments}
        availableRoleNames={form.availableRoleNames}
        roles={form.roles}
        teams={form.teams}
        workspaceOptions={form.workspaceOptions}
        onAddAssignment={form.handleAddAssignment}
        onRemove={form.handleRemoveAssignment}
        onRoleChange={form.handleRoleChange}
        onTeamAdminChange={form.handleTeamAdminChange}
        onWorkspaceChange={form.handleWorkspaceChange}
      />

      <div className="h-px bg-border-subtle w-full"></div>

      <CreateUserAuthoritySection
        isSuperAdmin={form.isSuperAdmin}
        onChange={form.setIsSuperAdmin}
      />

      <div className="bg-secondary-container/50 text-on-secondary-container p-sm rounded-lg flex items-start gap-sm">
        <span className="material-symbols-outlined text-[18px] mt-0.5 text-secondary">lock</span>
        <p className="font-body-sm text-[12px] leading-relaxed">
          A 24-hour single-use secure link will be generated. The user will set their own secret permanent password upon joining the platform.
        </p>
      </div>
    </CreateUserModalFrame>
  );
}
