import { useState } from 'react';
import { TEAM_JIT_REQUESTS, AVAILABLE_JIT_ROLES } from '@/constants';
import { getStorage, setStorage } from '../../../../lib/storage';
import ConfirmModal from '../../../../components/shared/ConfirmModal';
import Toast from '../../../../components/shared/Toast';
import SearchInput from '../../../../components/shared/SearchInput';
import EmptyState from '../../../../components/shared/EmptyState';

const DURATIONS = ['30m', '1h', '2h', '4h', '8h'];

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
  REJECTED: { label: 'Rejected', class: 'bg-red-50 text-red-700 border-red-200' },
};

export default function JitRequestView({ currentUser }) {
  const currentUserId = currentUser?.id || 'usr-dm';
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);

  const [requests, setRequests] = useState(() => getStorage('workspace_jit_requests', TEAM_JIT_REQUESTS));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'PAST'
  const [requesterFilter, setRequesterFilter] = useState('ALL'); // 'ALL' | 'ME'

  // Modal State for New Request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmRevokeReq, setConfirmRevokeReq] = useState(null);
  const [confirmRejectReq, setConfirmRejectReq] = useState(null);
  const [confirmWithdrawReq, setConfirmWithdrawReq] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editTicketId, setEditTicketId] = useState('');
  const [editJustification, setEditJustification] = useState('');
  const [editDuration, setEditDuration] = useState('2h');
  const [rejectReason, setRejectReason] = useState('Access not required for current sprint task.');
  const [selectedRole, setSelectedRole] = useState('K8S_WRITE');
  const [duration, setDuration] = useState('2h');
  const [ticketId, setTicketId] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const persistRequests = (next) => {
    setRequests(next);
    setStorage('workspace_jit_requests', next);
  };

  // Actions for Team Admin
  const handleApprove = (reqId) => {
    const next = requests.map((r) =>
      r.id === reqId
        ? {
            ...r,
            status: 'APPROVED',
            statusLabel: 'Active',
            approvedBy: currentUser?.name || 'Diana Morales',
            expiresAt: `${r.requestedDuration} remaining`,
          }
        : r
    );
    persistRequests(next);
    showToast('JIT access request approved. Lease is now active.');
  };

  const handleConfirmReject = () => {
    if (!confirmRejectReq) return;
    const reqId = confirmRejectReq.id;
    const next = requests.map((r) =>
      r.id === reqId
        ? {
            ...r,
            status: 'REJECTED',
            statusLabel: 'Rejected',
            rejectionReason: rejectReason || 'Rejected by Team Admin.',
            approvedBy: currentUser?.name || 'Diana Morales',
          }
        : r
    );
    persistRequests(next);
    setConfirmRejectReq(null);
    showToast('JIT access request rejected.', 'error');
  };

  const handleConfirmRevoke = () => {
    if (!confirmRevokeReq) return;
    const reqId = confirmRevokeReq.id;
    const next = requests.map((r) =>
      r.id === reqId
        ? {
            ...r,
            status: 'EXPIRED',
            statusLabel: 'Revoked Early',
            expiresAt: 'Revoked by Admin',
          }
        : r
    );
    persistRequests(next);
    setConfirmRevokeReq(null);
    showToast('Active JIT lease revoked early by Team Admin.');
  };

  const handleConfirmWithdraw = () => {
    if (!confirmWithdrawReq) return;
    const reqId = confirmWithdrawReq.id;
    const next = requests.filter((r) => r.id !== reqId);
    persistRequests(next);
    setConfirmWithdrawReq(null);
    showToast('Access request withdrawn successfully.');
  };

  const handleStartEditRequest = (req) => {
    setEditingRequest(req);
    setEditTicketId(req.ticketId || '');
    setEditJustification(req.justification || '');
    setEditDuration(req.requestedDuration || '2h');
  };

  const handleSaveEditRequest = (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    if (!editTicketId.trim() || !editJustification.trim()) {
      showToast('Please fill in both Ticket ID and Justification.', 'error');
      return;
    }

    const next = requests.map((r) =>
      r.id === editingRequest.id
        ? {
            ...r,
            ticketId: editTicketId.trim(),
            justification: editJustification.trim(),
            requestedDuration: editDuration,
          }
        : r
    );
    persistRequests(next);
    setEditingRequest(null);
    showToast('Pending JIT request updated successfully.');
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!ticketId.trim() || !justification.trim()) {
      showToast('Please fill in both Ticket ID and Justification.', 'error');
      return;
    }

    setSubmitting(true);
    const roleConfig = AVAILABLE_JIT_ROLES.find((r) => r.id === selectedRole);

    setTimeout(() => {
      const newReq = {
        id: `req_${Date.now().toString().slice(-4)}`,
        memberId: currentUserId,
        memberName: currentUser?.name || 'Diana Morales',
        memberRole: currentUser?.role || 'Lead Architect',
        isTeamAdmin: isTeamAdmin,
        memberInitials: currentUser?.initials || 'DM',
        requestedRole: selectedRole,
        requestedRoleLabel: roleConfig?.label || selectedRole,
        justification,
        ticketId,
        requestedDuration: duration,
        status: 'PENDING',
        approvalLevel: isTeamAdmin ? 'SUPER_ADMIN' : 'TEAM_ADMIN',
        statusLabel: isTeamAdmin ? 'Pending Super Admin Review' : 'Pending Team Admin Review',
        approvedBy: null,
        expiresAt: null,
        createdAt: 'Just now',
        risk: roleConfig?.risk || 'Medium',
      };

      setRequests((prev) => [newReq, ...prev]);
      setSubmitting(false);
      setIsModalOpen(false);
      setTicketId('');
      setJustification('');
      showToast(
        isTeamAdmin
          ? 'JIT request submitted. Escalated to Super Admin for approval.'
          : 'Access request submitted. Awaiting Team Admin approval.'
      );
    }, 400);
  };

  // Filtered Requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedRoleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.justification.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRequester = requesterFilter === 'ALL' || r.memberId === currentUserId;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && r.status === 'PENDING') ||
      (statusFilter === 'APPROVED' && r.status === 'APPROVED') ||
      (statusFilter === 'PAST' && (r.status === 'EXPIRED' || r.status === 'REJECTED'));

    return matchesSearch && matchesRequester && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const activeCount = requests.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Toast Notification */}
      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            JIT Access Requests
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Time-bounded privilege elevation requests across Acme Engineering
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-sm text-label-sm transition-opacity shadow-sm cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          <span>+ Request Elevation</span>
        </button>
      </div>

      {/* Live Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider block">
              Pending Review
            </span>
            <span className="text-[20px] font-bold text-on-surface leading-tight">
              {pendingCount} {pendingCount === 1 ? 'Request' : 'Requests'}
            </span>
          </div>
        </div>

        <div className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider block">
              Active Leases
            </span>
            <span className="text-[20px] font-bold text-on-surface leading-tight">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">history</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider block">
              Total Recorded
            </span>
            <span className="text-[20px] font-bold text-on-surface leading-tight">
              {requests.length} Requests
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search by teammate, role, or ticket..."
            className="flex-1 max-w-md"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Requester Filter */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setRequesterFilter('ALL')}
              className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                requesterFilter === 'ALL'
                  ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Team Members
            </button>
            <button
              type="button"
              onClick={() => setRequesterFilter('ME')}
              className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                requesterFilter === 'ME'
                  ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              My Requests
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'APPROVED', label: `Active (${activeCount})` },
              { id: 'PAST', label: 'Past / Expired' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                  statusFilter === tab.id
                    ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Clean Table */}
      <div className="w-full bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-low text-[12px] font-semibold text-on-surface-variant">
                <th className="py-3 px-4 w-48">Requester</th>
                <th className="py-3 px-4 w-52">Elevated Privilege</th>
                <th className="py-3 px-4">Justification &amp; Ticket</th>
                <th className="py-3 px-4 w-32">Duration</th>
                <th className="py-3 px-4 w-36 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-body-sm">
              {filteredRequests.map((req) => {
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
                    <td className="py-3.5 px-4 align-top min-w-[240px]">
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
                        {req.status === 'APPROVED' && req.expiresAt
                          ? 'Active'
                          : statusInfo.label}
                      </span>
                    </td>

                    {/* Action / Governance */}
                    <td className="py-3.5 px-4 w-40 text-right align-top">
                      {req.status === 'PENDING' ? (
                        req.approvalLevel === 'SUPER_ADMIN' ? (
                          <div className="flex flex-col items-end">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">security</span>
                              Super Admin Review
                            </span>
                            <span className="text-[10px] text-on-surface-variant mt-0.5">
                              {isRequester ? 'Awaiting Super Admin' : 'Admin escalation'}
                            </span>
                          </div>
                        ) : isTeamAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprove(req.id)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectReason('Access not required for current sprint task.');
                                setConfirmRejectReq(req);
                              }}
                              className="px-2 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isRequester ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditRequest(req)}
                              className="px-2 py-1 rounded-md border border-border-subtle text-on-surface hover:bg-surface-container text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Edit pending request"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmWithdrawReq(req)}
                              className="px-2 py-1 rounded-md border border-border-subtle text-on-surface-variant hover:text-error hover:border-error/40 hover:bg-error-container/20 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Withdraw your pending request"
                            >
                              <span className="material-symbols-outlined text-[13px]">close</span>
                              <span>Withdraw</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 italic">
                            Awaiting Team Admin
                          </span>
                        )
                      ) : req.status === 'APPROVED' ? (
                        isTeamAdmin ? (
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeReq(req)}
                            className="px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">block</span>
                            <span>Revoke</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">Active</span>
                        )
                      ) : (
                        <span className="text-[11px] text-on-surface-variant">Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <EmptyState
            icon="verified"
            title="No access requests found"
            message='Try selecting "All Team Members" or clearing filters.'
          />
        )}
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-md border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Request Elevated Privilege
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  Time-bounded Just-in-Time access for emergency or maintenance tasks
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-md flex flex-col gap-3.5">
              {/* Role */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Target Role / Capability *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
                >
                  {AVAILABLE_JIT_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} ({r.risk} Risk)
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket & Duration (2 columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                    Ticket / Incident Ref *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INC-8492 or ENG-102"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                    Lease Duration *
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`py-2 text-[12px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                          duration === d
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-low text-on-surface border-border-subtle hover:bg-surface-container'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Business Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this elevation is required for your current task or incident..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
                ></textarea>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    {isTeamAdmin ? 'shield' : 'supervisor_account'}
                  </span>
                  <span>
                    {isTeamAdmin
                      ? 'Routes to Super Admin for authorization'
                      : 'Routes to Team Admin (Diana Morales) for review'}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Lease Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmRevokeReq)}
        title="Revoke Active JIT Lease?"
        description={`Are you sure you want to terminate the active lease for ${confirmRevokeReq?.requesterName} (${confirmRevokeReq?.roleName})? Elevated privileges will be invalidated immediately.`}
        confirmText="Yes, Revoke Lease"
        cancelText="Keep Active"
        confirmVariant="danger"
        icon="block"
        onConfirm={handleConfirmRevoke}
        onClose={() => setConfirmRevokeReq(null)}
      >
        {confirmRevokeReq && (
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-border-subtle flex items-center justify-between text-[11px] text-on-surface-variant mt-2">
            <span>Ticket: <span className="font-mono font-bold text-on-surface">{confirmRevokeReq.ticketId}</span></span>
            <span>Remaining: <span className="font-semibold text-error">{confirmRevokeReq.expiresAt}</span></span>
          </div>
        )}
      </ConfirmModal>

      {/* Reject Request Modal with Reason */}
      <ConfirmModal
        isOpen={Boolean(confirmRejectReq)}
        title="Reject Access Request"
        description={`Provide a brief rejection rationale for ${confirmRejectReq?.requesterName}:`}
        confirmText="Confirm Rejection"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="cancel"
        onConfirm={handleConfirmReject}
        onClose={() => setConfirmRejectReq(null)}
      >
        <textarea
          rows={2}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full mt-2 p-2.5 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Reason for rejection..."
        />
      </ConfirmModal>

      {/* Withdraw Request Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmWithdrawReq)}
        title="Withdraw Access Request?"
        description={`Are you sure you want to cancel and withdraw your pending JIT request for ${confirmWithdrawReq?.roleName} (Ticket #${confirmWithdrawReq?.ticketId})?`}
        confirmText="Yes, Withdraw Request"
        cancelText="Keep Request"
        confirmVariant="danger"
        icon="cancel_schedule_send"
        onConfirm={handleConfirmWithdraw}
        onClose={() => setConfirmWithdrawReq(null)}
      />

      {/* Edit Pending Request Modal (PATCH /api/teams/:id/access-requests/:id) */}
      {editingRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl p-lg flex flex-col gap-md border border-border-subtle animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-sm border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-[16px] font-bold text-on-surface">
                    Edit Pending JIT Request
                  </h3>
                  <p className="text-[12px] text-on-surface-variant">
                    Update your ticket ID, duration, or justification before review.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditRequest} className="flex flex-col gap-4">
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Elevated Role
                </label>
                <input
                  type="text"
                  disabled
                  value={editingRequest.requestedRoleLabel || editingRequest.roleName}
                  className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface opacity-70 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                    Ticket ID / Issue Key
                  </label>
                  <input
                    type="text"
                    required
                    value={editTicketId}
                    onChange={(e) => setEditTicketId(e.target.value)}
                    placeholder="e.g. INC-8492"
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                    Requested Duration
                  </label>
                  <select
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="30m">30 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="2h">2 hours</option>
                    <option value="4h">4 hours</option>
                    <option value="8h">8 hours (Full Shift)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Business &amp; Technical Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={editJustification}
                  onChange={(e) => setEditJustification(e.target.value)}
                  placeholder="Explain why this elevated lease is necessary..."
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
