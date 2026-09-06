import SearchInput from '@/components/shared/SearchInput';

export default function InvitationsTable({
  invitations,
  totalCount,
  searchQuery,
  setSearchQuery,
  canInvite,
  onOpenInviteModal,
  onRevokeInvite,
}) {
  return (
    <div className="flex flex-col gap-md animate-in fade-in duration-150">
      {/* Search bar for invitations */}
      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search invitations by email, name, or role..."
          className="flex-1 max-w-md"
        />
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-on-surface-variant text-[12px] hidden sm:inline">
            Showing {invitations.length} of {totalCount} invitations
          </span>
          {canInvite && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="px-md py-2 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:opacity-90 shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Invite New Teammate</span>
            </button>
          )}
        </div>
      </div>

      {/* Invitations Table */}
      <div className="w-full rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-body-sm">
          <thead>
            <tr className="bg-surface-container-low border-b border-border-subtle text-on-surface-variant font-label-bold text-label-sm">
              <th className="py-3 px-4">Invited Member</th>
              <th className="py-3 px-4">Assigned Role</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Invited By</th>
              <th className="py-3 px-4">Status &amp; Expiry</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant/60">
                      forward_to_inbox
                    </span>
                    <p className="font-medium text-body-base">No pending invitations</p>
                    <p className="text-[12px] text-on-surface-variant">
                      All invited members have accepted or no invitations match your search.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface font-label-bold flex items-center justify-center text-[12px]">
                        {inv.name ? inv.name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-bold text-on-surface">{inv.name}</span>
                        <span className="text-[12px] text-on-surface-variant font-mono">{inv.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[12px] font-medium">
                      {inv.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{inv.department}</td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{inv.invitedBy}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 text-warning-text font-label-bold text-[12px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning-text"></span>
                        {inv.status}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">{inv.expiresDate}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {canInvite ? (
                      <button
                        type="button"
                        onClick={() => onRevokeInvite(inv)}
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
                        title="Revoke Invitation"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-on-surface-variant italic">Admin only</span>
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
