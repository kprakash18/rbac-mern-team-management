import EmptyState from '@/components/shared/EmptyState';

const RISK_BADGES = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-red-50 text-red-700 border-red-200 font-semibold',
};

const STATUS_BADGES = {
  PENDING: { label: 'Pending Approval', class: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Active Lease', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPIRED: { label: 'Expired', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  REVOKED: { label: 'Revoked Early', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  REJECTED: { label: 'Rejected', class: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelled', class: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function JitRequestTable({
  requests,
  currentUserId,
  canApprove,
  canApproveAll,
  isTeamAdmin,
  isSuperAdmin,
  onApprove,
  onReject,
  onRevoke,
  onStartEdit,
  onWithdraw,
}) {
  const renderActions = (req) => {
    const isRequester = req.memberId === currentUserId || req.requesterId === currentUserId;
    const needsSuperAdminApproval =
      req.approvalLevel === 'SUPER_ADMIN' || req.needsSuperAdminApproval;
    const canActOnRequest =
      canApproveAll || (canApprove && !needsSuperAdminApproval && req.memberId !== currentUserId);

    if (req.status === 'PENDING') {
      if (isRequester) {
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onStartEdit(req)}
              className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-[11px] transition-colors cursor-pointer border border-border-subtle flex items-center gap-1"
              title="Edit Request"
            >
              <span className="material-symbols-outlined text-[13px]">edit</span>
              Edit
            </button>
            <button
              type="button"
              onClick={() => onWithdraw(req)}
              className="px-2 py-1 rounded-md bg-surface-container hover:bg-red-50 hover:text-red-700 text-on-surface-variant font-medium text-[11px] transition-colors cursor-pointer border border-border-subtle flex items-center gap-1"
              title="Cancel / Delete Request"
            >
              <span className="material-symbols-outlined text-[13px]">delete</span>
              Delete
            </button>
          </div>
        );
      }

      if (needsSuperAdminApproval && !canApproveAll) {
        return (
          <div className="flex flex-col items-end">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">security</span>
              Super Admin Review
            </span>
            <span className="text-[10px] text-on-surface-variant mt-0.5">
              Elevation restricted
            </span>
          </div>
        );
      }

      if (canActOnRequest) {
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onApprove(req.id)}
              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-label-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject(req)}
              className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-red-50 hover:text-red-700 text-on-surface-variant font-medium text-[11px] transition-colors cursor-pointer border border-border-subtle"
            >
              Reject
            </button>
          </div>
        );
      }

      return <span className="text-[11px] text-on-surface-variant italic">Pending review</span>;
    }

    if (req.status === 'APPROVED') {
      if (isTeamAdmin || isSuperAdmin) {
        return (
          <button
            type="button"
            onClick={() => onRevoke(req)}
            className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-label-bold text-[11px] transition-colors cursor-pointer border border-red-200"
          >
            Revoke Early
          </button>
        );
      }
      return <span className="text-[11px] text-emerald-600 font-medium">Active</span>;
    }

    return <span className="text-[11px] text-on-surface-variant">Closed</span>;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-212.5">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-container-low text-[12px] font-semibold text-on-surface-variant">
              <th className="py-3 px-4 w-48">Requester</th>
              <th className="py-3 px-4 w-52">Elevated Privilege</th>
              <th className="py-3 px-4">Justification &amp; Ticket</th>
              <th className="py-3 px-4 w-32">Duration</th>
              <th className="py-3 px-4 w-36 text-center">Status</th>
              <th className="py-3 px-4 w-40 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-body-sm">
            {requests.map((req) => {
              const isRequester = req.memberId === currentUserId || req.requesterId === currentUserId;
              const statusInfo = STATUS_BADGES[req.status] || STATUS_BADGES.PENDING;

              return (
                <tr key={req.id} className="hover:bg-surface-container-low/60 transition-colors">
                  {/* Requester */}
                  <td className="py-3.5 px-4 w-48 align-top">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isRequester
                            ? 'bg-primary text-on-primary ring-1 ring-primary'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {req.memberInitials}
                      </div>
                      <div className="min-w-0">
                        <span className="font-label-bold text-[13px] text-on-surface block truncate">
                          {req.memberName} {isRequester && '(You)'}
                        </span>
                        <span className="text-[11px] text-on-surface-variant block truncate">
                          {req.memberRole}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Elevated Privilege & Risk */}
                  <td className="py-3.5 px-4 w-52 align-top">
                    <span className="font-medium text-[13px] text-on-surface block leading-snug">
                      {req.requestedRoleLabel}
                    </span>
                    <span
                      className={`inline-block mt-1 px-2 py-0.2 rounded text-[10px] border ${
                        RISK_BADGES[req.risk] || RISK_BADGES.Medium
                      }`}
                    >
                      {req.risk} Risk
                    </span>
                  </td>

                  {/* Justification & Ticket */}
                  <td className="py-3.5 px-4 align-top min-w-60">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-surface-container border border-border-subtle text-on-surface">
                        {req.ticketId}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">• {req.createdAt}</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant line-clamp-2">
                      {req.justification}
                    </p>
                    {req.rejectionReason && (
                      <p className="text-[11px] text-red-600 italic mt-1">
                        Reason: {req.rejectionReason}
                      </p>
                    )}
                  </td>

                  {/* Duration / Expiry */}
                  <td className="py-3.5 px-4 w-32 align-top">
                    <span className="text-[12px] font-medium text-on-surface block">
                      {req.requestedDuration}
                    </span>
                    {req.expiresAt && (
                      <span className="text-[11px] text-on-surface-variant block font-mono mt-0.5">
                        {req.expiresAt}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 w-36 text-center align-top">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border text-center ${statusInfo.class}`}
                    >
                      {req.status === 'APPROVED' && req.expiresAt ? 'Active' : statusInfo.label}
                    </span>
                  </td>

                  {/* Action / Governance */}
                  <td className="py-3.5 px-4 w-40 text-right align-top">
                    {renderActions(req)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <EmptyState
          icon="verified"
          title="No access requests found"
          message='Try selecting "All Team Members" or clearing filters.'
        />
      )}
    </>
  );
}
