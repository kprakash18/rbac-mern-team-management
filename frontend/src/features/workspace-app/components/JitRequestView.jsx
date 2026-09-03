import { useState } from 'react';
import { TEAM_JIT_REQUESTS, AVAILABLE_JIT_ROLES } from '../constants/workspaceApp.constants';

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
  const isTeamAdmin = currentUser?.isTeamAdmin ?? true;

  const [requests, setRequests] = useState(TEAM_JIT_REQUESTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'PAST'
  const [requesterFilter, setRequesterFilter] = useState('ALL'); // 'ALL' | 'ME'

  // Modal State for New Request
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Actions for Team Admin
  const handleApprove = (reqId) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'APPROVED',
              statusLabel: 'Active',
              approvedBy: currentUser?.name || 'Diana Morales',
              expiresAt: `${r.requestedDuration} remaining`,
            }
          : r
      )
    );
    showToast('JIT access request approved. Lease is now active.');
  };

  const handleReject = (reqId) => {
    const reason = window.prompt('Enter rejection reason (optional):', 'Access not required for current sprint task.');
    if (reason === null) return; // cancelled

    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'REJECTED',
              statusLabel: 'Rejected',
              rejectionReason: reason || 'Rejected by Team Admin.',
              approvedBy: currentUser?.name || 'Diana Morales',
            }
          : r
      )
    );
    showToast('JIT access request rejected.', 'error');
  };

  const handleRevoke = (reqId) => {
    if (!window.confirm('Revoke this active lease immediately?')) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'EXPIRED',
              statusLabel: 'Revoked Early',
              expiresAt: 'Revoked by Admin',
            }
          : r
      )
    );
    showToast('Active JIT lease revoked early.');
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
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-md py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-[13px] font-semibold transition-all animate-in slide-in-from-top-4 duration-200 border ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'error' ? 'cancel' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}

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
          <div className="relative flex items-center flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:border-primary outline-none transition-colors"
              placeholder="Search by teammate, role, or ticket..."
              type="text"
            />
          </div>
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
                const isRequester = req.memberId === currentUserId;
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
                              onClick={() => handleReject(req.id)}
                              className="px-2 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Reject
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
                            onClick={() => handleRevoke(req.id)}
                            className="px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Revoke
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
          <div className="py-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] block mb-1 text-on-surface-variant/50">
              verified
            </span>
            <span className="font-semibold text-on-surface block">No access requests found</span>
            <span className="text-[12px]">Try selecting "All Team Members" or clearing filters.</span>
          </div>
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
    </div>
  );
}
