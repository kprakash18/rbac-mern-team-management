import { ConfirmModal } from '@/shared/components';

function TeamMemberConfirmModals({
  confirmRemovalMember,
  confirmRevokeInvite,
  confirmSuspendMember,
  onCloseRemoval,
  onCloseRevoke,
  onCloseSuspend,
  onConfirmRemoval,
  onConfirmRevoke,
  onConfirmSuspend,
}) {
  return (
    <>
      <ConfirmModal
        isOpen={Boolean(confirmRevokeInvite)}
        title="Revoke Invitation?"
        description={`Are you sure you want to revoke the invitation for ${confirmRevokeInvite?.email}?`}
        confirmText="Yes, Revoke Invitation"
        confirmVariant="danger"
        icon="cancel"
        onConfirm={() => onConfirmRevoke(confirmRevokeInvite.id)}
        onClose={onCloseRevoke}
      />

      <ConfirmModal
        isOpen={Boolean(confirmRemovalMember)}
        title={`Remove ${confirmRemovalMember?.name}?`}
        description={`Are you sure you want to remove ${confirmRemovalMember?.name} from this workspace?`}
        confirmText="Yes, Remove Member"
        confirmVariant="danger"
        icon="warning"
        onConfirm={() => onConfirmRemoval(confirmRemovalMember.id)}
        onClose={onCloseRemoval}
      />

      <ConfirmModal
        isOpen={Boolean(confirmSuspendMember)}
        title={confirmSuspendMember?.status === 'Suspended' ? `Reactivate ${confirmSuspendMember?.name}?` : `Suspend ${confirmSuspendMember?.name}?`}
        description={
          confirmSuspendMember?.status === 'Suspended'
            ? `Restore permissions and access for ${confirmSuspendMember?.name}?`
            : `Suspend access for ${confirmSuspendMember?.name}?`
        }
        confirmText={confirmSuspendMember?.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
        confirmVariant={confirmSuspendMember?.status === 'Suspended' ? 'primary' : 'warning'}
        icon={confirmSuspendMember?.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
        onConfirm={() => onConfirmSuspend(confirmSuspendMember.id)}
        onClose={onCloseSuspend}
      />
    </>
  );
}

export default TeamMemberConfirmModals;
