import { Avatar, Badge, Button, SearchInput } from '@/shared/components';

function InvitationsPanel({
  canInvite,
  canRevokeInvite,
  invitations,
  searchQuery,
  onInvite,
  onRevoke,
  onSearchChange,
}) {
  return (
    <div className="flex flex-col gap-md animate-in fade-in duration-150">
      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onClear={() => onSearchChange({ target: { value: '' } })}
          placeholder="Search invitations..."
          className="flex-1 max-w-md"
        />
        {canInvite && (
          <Button size="sm" icon="add" onClick={onInvite}>
            Invite
          </Button>
        )}
      </div>

      <div className="w-full rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-body-sm">
          <thead>
            <tr className="bg-surface-container-low border-b border-border-subtle text-on-surface-variant font-label-bold text-label-sm">
              <th className="py-3 px-4">Invited Member</th>
              <th className="py-3 px-4">Assigned Role</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Invited By</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                  No pending invitations
                </td>
              </tr>
            ) : (
              invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={invitation.name} size="sm" />
                      <div>
                        <span className="font-label-bold text-on-surface block">{invitation.name}</span>
                        <span className="text-[12px] text-on-surface-variant font-mono">{invitation.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><Badge variant="outline">{invitation.role}</Badge></td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{invitation.department}</td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{invitation.invitedBy}</td>
                  <td className="py-3.5 px-4"><Badge variant="warning">{invitation.status}</Badge></td>
                  <td className="py-3.5 px-4 text-right">
                    {canRevokeInvite && (
                      <Button size="sm" variant="danger" icon="cancel" onClick={() => onRevoke(invitation)}>
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvitationsPanel;
