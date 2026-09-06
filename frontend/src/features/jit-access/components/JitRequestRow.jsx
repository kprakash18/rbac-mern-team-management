import { STATUS_BADGES } from '../constants/jitConstants';
import { Avatar, Badge, Button } from '@/shared/components';

export default function JitRequestRow({
  req,
  currentUserId,
  isTeamAdmin,
  isSuperAdmin,
  canApproveAll,
  onEdit,
  onWithdraw,
  onApprove,
  onReject,
  onRevoke,
}) {
  const isRequester = req.requesterId === currentUserId || req.memberId === currentUserId;
  const statusInfo = STATUS_BADGES[req.status] || STATUS_BADGES.PENDING;
  const needsSuperAdminApproval = req.approvalLevel === 'SUPER_ADMIN';
  const canActOnRequest = (isTeamAdmin && !needsSuperAdminApproval) || isSuperAdmin;

  const riskVariant =
    req.risk === 'Critical'
      ? 'danger'
      : req.risk === 'High'
      ? 'warning'
      : req.risk === 'Medium'
      ? 'warning'
      : 'success';

  const statusVariant =
    req.status === 'APPROVED'
      ? 'success'
      : req.status === 'PENDING'
      ? 'warning'
      : req.status === 'REVOKED' || req.status === 'REJECTED'
      ? 'danger'
      : 'neutral';

  return (
    <tr className="hover:bg-surface-container-low/60 transition-colors">
      <td className="py-3.5 px-4 w-44 align-top">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={req.memberName}
            initials={req.memberInitials}
            isCurrentUser={isRequester}
            size="md"
          />
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

      <td className="py-3.5 px-4 w-52 align-top">
        <span className="font-medium text-[13px] text-on-surface block leading-snug">
          {req.requestedRoleLabel}
        </span>
        <Badge variant={riskVariant} size="xs" className="mt-1">
          {req.risk} Risk
        </Badge>
      </td>

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

      <td className="py-3.5 px-4 w-36 text-center align-top">
        <Badge variant={statusVariant} size="pill">
          {req.status === 'APPROVED' && req.expiresAt ? 'Active' : statusInfo.label}
        </Badge>
      </td>

      <td className="py-3.5 px-4 w-40 text-right align-top">
        {req.status === 'PENDING' ? (
          isRequester ? (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="secondary"
                size="xs"
                icon="edit"
                onClick={() => onEdit(req)}
                title="Edit Request"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="xs"
                icon="delete"
                onClick={() => onWithdraw(req)}
                title="Cancel / Delete Request"
              >
                Delete
              </Button>
            </div>
          ) : needsSuperAdminApproval && !canApproveAll ? (
            <div className="flex flex-col items-end">
              <Badge variant="purple" size="sm" className="inline-flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[12px]">security</span>
                Super Admin Review
              </Badge>
              <span className="text-[10px] text-on-surface-variant mt-0.5">
                Elevation restricted
              </span>
            </div>
          ) : canActOnRequest ? (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="success"
                size="xs"
                onClick={() => onApprove(req.id)}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="xs"
                onClick={() => onReject(req)}
              >
                Reject
              </Button>
            </div>
          ) : (
            <span className="text-[11px] text-on-surface-variant italic">
              Pending review
            </span>
          )
        ) : req.status === 'APPROVED' ? (
          (isTeamAdmin || isSuperAdmin) ? (
            <Button
              variant="danger"
              size="xs"
              onClick={() => onRevoke(req)}
            >
              Revoke Early
            </Button>
          ) : (
            <span className="text-[11px] text-emerald-600 font-medium">Active</span>
          )
        ) : (
          <span className="text-[11px] text-on-surface-variant">Closed</span>
        )}
      </td>
    </tr>
  );
}
