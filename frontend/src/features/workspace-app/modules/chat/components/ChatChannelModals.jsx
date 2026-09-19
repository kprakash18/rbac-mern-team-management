import { Avatar, Button, ConfirmModal, Modal } from '@/shared/components';

function MemberCheckboxList({ members, selectedIds, onToggle, dense = false }) {
  return (
    <div className={`${dense ? 'max-h-40' : 'max-h-60'} overflow-y-auto space-y-1`}>
      {members.map((member) => (
        <label key={member.id} className={`flex items-center gap-2 ${dense ? 'p-1.5' : 'p-2'} rounded hover:bg-surface-container cursor-pointer`}>
          <input
            type="checkbox"
            checked={selectedIds.includes(member.id)}
            onChange={(event) => onToggle(member.id, event.target.checked)}
            className="rounded text-primary"
          />
          <Avatar name={member.name} size="sm" />
          <span className="text-body-sm text-on-surface">{member.name}</span>
        </label>
      ))}
    </div>
  );
}

function CreateChannelModal({
  isOpen,
  members,
  name,
  onClose,
  onNameChange,
  onSubmit,
  onToggleMember,
  onTopicChange,
  selectedMemberIds,
  topic,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel" subtitle="Create a dedicated channel for team communication">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-label-sm font-label-bold text-on-surface block mb-1">Channel Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. api-architecture"
            value={name}
            onChange={onNameChange}
            className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none"
          />
        </div>
        <div>
          <label className="text-label-sm font-label-bold text-on-surface block mb-1">Topic</label>
          <input
            type="text"
            placeholder="What is this channel for?"
            value={topic}
            onChange={onTopicChange}
            className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none"
          />
        </div>
        <div>
          <label className="text-label-sm font-label-bold text-on-surface block mb-1">Select Members</label>
          <MemberCheckboxList
            dense
            members={members}
            selectedIds={selectedMemberIds}
            onToggle={onToggleMember}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create Channel</Button>
        </div>
      </form>
    </Modal>
  );
}

function InviteMembersModal({
  activeChannel,
  inviteSelectedIds,
  isOpen,
  members,
  onClose,
  onSubmit,
  onToggleMember,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite to Channel" subtitle={`Add members to #${activeChannel.name}`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <MemberCheckboxList
          members={members}
          selectedIds={inviteSelectedIds}
          onToggle={onToggleMember}
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!inviteSelectedIds.length}>Add Selected</Button>
        </div>
      </form>
    </Modal>
  );
}

function ChatChannelModals({
  activeChannel,
  confirmDeleteChannel,
  confirmLeaveChannel,
  createForm,
  inviteForm,
  isCreateOpen,
  isInviteOpen,
  members,
  onCloseCreate,
  onCloseInvite,
  onCloseDelete,
  onCloseLeave,
  onConfirmDelete,
  onConfirmLeave,
  onCreateSubmit,
  onInviteSubmit,
  onToggleCreateMember,
  onToggleInviteMember,
}) {
  return (
    <>
      <CreateChannelModal
        isOpen={isCreateOpen}
        members={members}
        name={createForm.name}
        onClose={onCloseCreate}
        onNameChange={createForm.onNameChange}
        onSubmit={onCreateSubmit}
        onToggleMember={onToggleCreateMember}
        onTopicChange={createForm.onTopicChange}
        selectedMemberIds={createForm.selectedMemberIds}
        topic={createForm.topic}
      />

      <InviteMembersModal
        activeChannel={activeChannel}
        inviteSelectedIds={inviteForm.selectedIds}
        isOpen={isInviteOpen}
        members={members}
        onClose={onCloseInvite}
        onSubmit={onInviteSubmit}
        onToggleMember={onToggleInviteMember}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDeleteChannel)}
        title={`Delete #${confirmDeleteChannel?.name}?`}
        description="Are you sure you want to delete this channel and its messages?"
        confirmText="Delete Channel"
        confirmVariant="danger"
        icon="delete"
        onConfirm={() => onConfirmDelete(confirmDeleteChannel)}
        onClose={onCloseDelete}
      />

      <ConfirmModal
        isOpen={Boolean(confirmLeaveChannel)}
        title={`Leave #${confirmLeaveChannel?.name}?`}
        description="Are you sure you want to leave this channel?"
        confirmText="Leave Channel"
        confirmVariant="warning"
        icon="logout"
        onConfirm={() => onConfirmLeave(confirmLeaveChannel)}
        onClose={onCloseLeave}
      />
    </>
  );
}

export default ChatChannelModals;
