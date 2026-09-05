import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../../../../lib/socket';
import api from '../../../../lib/api';
import { useApp } from '@/context/useApp';
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
  REVOKED: { label: 'Revoked Early', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  REJECTED: { label: 'Rejected', class: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelled', class: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function JitRequestView({ currentUser, workspace }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  // canApproveAll: Super Admins can approve any request; Team Admins can only approve non-Team-Admin requests
  const canApproveAll = isSuperAdmin;

  const [requests, setRequests] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [selectedRole, setSelectedRole] = useState('');
  const [duration, setDuration] = useState('2h');
  const [ticketId, setTicketId] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequestsAndCatalog = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [reqsRes, permsRes] = await Promise.allSettled([
        api.get(`/api/teams/${teamId}/access-requests`),
        api.get('/api/permissions'),
      ]);

      if (reqsRes.status === 'fulfilled') {
        const raw = reqsRes.value.data?.data?.accessRequests || reqsRes.value.data?.data || [];
        const formatted = raw.map((r) => {
          // requesterId is populated by backend: { _id, name, email }
          const reqUser = (r.requesterId && typeof r.requesterId === 'object') ? r.requesterId : {};
          const perm = (r.permissionId && typeof r.permissionId === 'object') ? r.permissionId : {};
          const name = reqUser.name || reqUser.email || 'Member';
          const durationLabel = r.durationHours
            ? (r.durationHours < 1 ? `${Math.round(r.durationHours * 60)}m` : `${r.durationHours}h`)
            : r.durationMinutes
              ? `${r.durationMinutes}m`
              : '—';
          return {
            // spread raw first so explicit fields below always win
            ...r,
            id: r._id || r.id,
            _id: r._id || r.id,
            // requester identity (populated)
            memberName: name,
            memberInitials: name.slice(0, 2).toUpperCase(),
            memberEmail: reqUser.email || '',
            memberId: reqUser._id?.toString() || reqUser.id?.toString() || (typeof r.requesterId === 'string' ? r.requesterId : ''),
            requesterId: reqUser._id?.toString() || reqUser.id?.toString() || (typeof r.requesterId === 'string' ? r.requesterId : ''),
            // permission label (populated)
            requestedRoleLabel: perm.key || perm.name || 'Custom Permission',
            roleKey: perm.key || 'permission',
            risk: perm.category === 'Security' || perm.category === 'Admin' ? 'High' : 'Medium',
            riskLevel: perm.category === 'Security' || perm.category === 'Admin' ? 'High' : 'Medium',
            // other display fields
            justification: r.reason || '',
            ticketId: r.ticketId || `REQ-${(r._id || '').slice(-4).toUpperCase()}`,
            requestedDuration: durationLabel,
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
            status: r.status || 'PENDING',
            statusLabel:
              r.status === 'APPROVED'
                ? 'Active'
                : r.status === 'PENDING'
                ? 'Pending Approval'
                : r.status === 'REVOKED'
                ? 'Revoked Early'
                : r.status === 'REJECTED'
                ? 'Rejected'
                : r.status === 'CANCELLED'
                ? 'Cancelled'
                : r.status,
            // approval hierarchy — set by backend, drives UI gating
            approvalLevel: r.approvalLevel || 'TEAM_ADMIN',
            needsSuperAdminApproval: r.approvalLevel === 'SUPER_ADMIN',
          };
        });
        setRequests(formatted);
      }

      if (permsRes.status === 'fulfilled') {
        const rawPerms = permsRes.value.data?.data?.permissions || permsRes.value.data?.data || [];
        setPermissionsCatalog(rawPerms);
        // Always reset to first permission when catalog loads (ensures a valid default)
        if (rawPerms.length > 0) {
          setSelectedRole(rawPerms[0]._id || rawPerms[0].key);
        }
      }
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId, selectedRole]);

  useEffect(() => {
    fetchRequestsAndCatalog();
  }, [fetchRequestsAndCatalog]);

  // Real-time socket listeners — keep both requester and admin screens in sync
  useEffect(() => {
    if (!teamId) return;
    const socket = getSocket();
    if (!socket) return;

    // A new JIT request was submitted → admins see it immediately
    const handleRequestCreated = ({ accessRequest }) => {
      if (!accessRequest) return;
      // Re-fetch to get fully populated request object
      fetchRequestsAndCatalog();
    };

    // A request was approved or rejected → requester's status badge updates live
    const handleRequestResolved = ({ requestId, status }) => {
      if (!requestId || !status) return;
      const id = String(requestId);
      setRequests((prev) =>
        prev.map((r) =>
          String(r.id) === id || String(r._id) === id
            ? {
                ...r,
                status,
                statusLabel:
                  status === 'APPROVED' ? 'Active'
                  : status === 'REJECTED' ? 'Rejected'
                  : status === 'REVOKED' ? 'Revoked Early'
                  : status === 'CANCELLED' ? 'Cancelled'
                  : status,
              }
            : r
        )
      );
    };

    // A grant was revoked → both admin and user see the updated status
    const handleGrantRevoked = ({ requestId }) => {
      const matchId = String(requestId || '');
      if (!matchId) {
        // Fallback: refresh list if we can't match by requestId
        fetchRequestsAndCatalog();
        return;
      }
      setRequests((prev) =>
        prev.map((r) =>
          String(r.id) === matchId || String(r._id) === matchId
            ? { ...r, status: 'REVOKED', statusLabel: 'Revoked Early' }
            : r
        )
      );
    };

    socket.on('access_request:created', handleRequestCreated);
    socket.on('access_request:resolved', handleRequestResolved);
    socket.on('access_grant:revoked', handleGrantRevoked);

    return () => {
      socket.off('access_request:created', handleRequestCreated);
      socket.off('access_request:resolved', handleRequestResolved);
      socket.off('access_grant:revoked', handleGrantRevoked);
    };
  }, [teamId, fetchRequestsAndCatalog]);

  // Actions for Team Admin
  const handleApprove = async (reqId) => {
    if (!teamId) return;
    try {
      await api.post(`/api/teams/${teamId}/access-requests/${reqId}/approve`);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'APPROVED',
                statusLabel: 'Active',
                approvedBy: currentUser?.name || 'Admin',
              }
            : r
        )
      );
      showToast('JIT access request approved. Lease is now active.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to approve request:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to approve request.', 'error');
    }
  };

  const handleConfirmReject = async () => {
    if (!confirmRejectReq || !teamId) return;
    const reqId = confirmRejectReq.id;
    try {
      await api.post(`/api/teams/${teamId}/access-requests/${reqId}/reject`, {
        reason: rejectReason || 'Rejected by Team Admin.',
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'REJECTED',
                statusLabel: 'Rejected',
                rejectionReason: rejectReason || 'Rejected by Team Admin.',
              }
            : r
        )
      );
      setConfirmRejectReq(null);
      showToast('JIT access request rejected.', 'error');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to reject request:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to reject request.', 'error');
    }
  };

  const handleConfirmRevoke = async () => {
    if (!confirmRevokeReq || !teamId) return;
    const reqId = confirmRevokeReq.id;
    try {
      await api.delete(`/api/teams/${teamId}/access-requests/${reqId}/revoke`);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'REVOKED',
                statusLabel: 'Revoked Early',
              }
            : r
        )
      );
      setConfirmRevokeReq(null);
      showToast('Active JIT lease revoked early.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to revoke request:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to revoke grant.', 'error');
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!confirmWithdrawReq || !teamId) return;
    const reqId = confirmWithdrawReq.id;
    try {
      await api.delete(`/api/teams/${teamId}/access-requests/${reqId}`);
      setRequests((prev) => prev.filter((r) => r.id !== reqId && r._id !== reqId));
      setConfirmWithdrawReq(null);
      showToast('Access request withdrawn successfully.');
    } catch (err) {
      console.error('Failed to withdraw request:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to withdraw request.', 'error');
    }
  };

  const handleStartEditRequest = (req) => {
    setEditingRequest(req);
    setEditTicketId(req.ticketId || '');
    setEditJustification(req.justification || '');
    setEditDuration(req.requestedDuration || '2h');
  };

  const handleSaveEditRequest = async (e) => {
    e.preventDefault();
    if (!editingRequest || !teamId) return;
    if (!editJustification.trim()) {
      showToast('Please fill in Justification.', 'error');
      return;
    }

    try {
      const minutes = parseInt(editDuration, 10) * (editDuration.includes('h') ? 60 : 1) || 120;
      await api.patch(`/api/teams/${teamId}/access-requests/${editingRequest.id}`, {
        reason: editJustification.trim(),
        durationMinutes: minutes,
        resource: editTicketId.trim(),
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === editingRequest.id
            ? {
                ...r,
                ticketId: editTicketId.trim() || r.ticketId,
                justification: editJustification.trim(),
                requestedDuration: editDuration,
              }
            : r
        )
      );
      setEditingRequest(null);
      showToast('Pending JIT request updated successfully.');
    } catch (err) {
      console.error('Failed to update request:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to update request.', 'error');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!justification.trim() || !teamId) {
      showToast('Please provide a justification.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const minutes = parseInt(duration, 10) * (duration.includes('h') ? 60 : 1) || 120;
      const targetPermission =
        permissionsCatalog.find((p) => p._id === selectedRole || p.key === selectedRole) ||
        permissionsCatalog[0];

      const payload = {
        permissionId: targetPermission?._id,
        permissionKey: targetPermission?.key,
        reason: justification.trim(),
        durationMinutes: minutes,
      };

      const res = await api.post(`/api/teams/${teamId}/access-requests`, payload);
      const created = res.data?.data || payload;
      setRequests((prev) => [
        {
          id: created._id || created.id,
          _id: created._id || created.id,
          roleTitle: targetPermission?.key || 'Custom Permission',
          requestedRoleLabel: targetPermission?.key || 'Custom Permission',
          roleKey: targetPermission?.key || 'permission',
          riskLevel: 'Medium',
          requesterName: currentUser?.name || 'Member',
          memberName: currentUser?.name || 'Member',
          requesterInitials: (currentUser?.name || 'M').slice(0, 2).toUpperCase(),
          memberInitials: (currentUser?.name || 'M').slice(0, 2).toUpperCase(),
          requesterId: currentUserId,
          memberId: currentUserId,
          justification: justification.trim(),
          ticketId: ticketId.trim() || `REQ-${(created._id || '').slice(-4).toUpperCase()}`,
          requestedDuration: duration,
          createdAt: 'Just now',
          status: 'PENDING',
          statusLabel: 'Pending Approval',
          ...created,
        },
        ...prev,
      ]);

      setIsModalOpen(false);
      setTicketId('');
      setJustification('');
      showToast('Elevation request submitted successfully!');
    } catch (err) {
      console.error('Failed to submit request:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to submit access request.', 'error');
    } finally {
      setSubmitting(false);
    }
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
      (statusFilter === 'PAST' && (r.status === 'EXPIRED' || r.status === 'REJECTED' || r.status === 'REVOKED' || r.status === 'CANCELLED'));

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
          {/* Requester Filter — visible to admins only */}
          {(isTeamAdmin || isSuperAdmin) && (
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
          )}

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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
            <span className="text-[13px] font-medium">Loading access requests...</span>
          </div>
        ) : (
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
                  {filteredRequests.map((req) => {
                    const isRequester = req.memberId === currentUserId || req.requesterId === currentUserId;
                    // A request needs Super Admin approval when the requester is themselves a Team Admin.
                    // The backend stores approvalLevel, but if not set we derive it from the requester's role
                    // returned by the populate. We flag it in formatting via a field the frontend can trust.
                    const needsSuperAdminApproval =
                      req.approvalLevel === 'SUPER_ADMIN' ||
                      req.needsSuperAdminApproval;

                    // Approve/Reject visible to: Super Admin always, Team Admin only if request doesn't need SA
                    const canActOnRequest =
                      canApproveAll || (isTeamAdmin && !needsSuperAdminApproval && req.memberId !== currentUserId);

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
                            {req.status === 'APPROVED' && req.expiresAt
                              ? 'Active'
                              : statusInfo.label}
                          </span>
                        </td>

                        {/* Action / Governance */}
                        <td className="py-3.5 px-4 w-40 text-right align-top">
                          {req.status === 'PENDING' ? (
                            isRequester ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditRequest(req)}
                                  className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-[11px] transition-colors cursor-pointer border border-border-subtle flex items-center gap-1"
                                  title="Edit Request"
                                >
                                  <span className="material-symbols-outlined text-[13px]">edit</span>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmWithdrawReq(req)}
                                  className="px-2 py-1 rounded-md bg-surface-container hover:bg-red-50 hover:text-red-700 text-on-surface-variant font-medium text-[11px] transition-colors cursor-pointer border border-border-subtle flex items-center gap-1"
                                  title="Cancel / Delete Request"
                                >
                                  <span className="material-symbols-outlined text-[13px]">delete</span>
                                  Delete
                                </button>
                              </div>
                            ) : needsSuperAdminApproval && !canApproveAll ? (
                              <div className="flex flex-col items-end">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">security</span>
                                  Super Admin Review
                                </span>
                                <span className="text-[10px] text-on-surface-variant mt-0.5">
                                  Elevation restricted
                                </span>
                              </div>
                            ) : canActOnRequest ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(req.id)}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-label-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRejectReq(req)}
                                  className="px-2 py-1 rounded-md bg-surface-container hover:bg-red-50 hover:text-red-700 text-on-surface-variant font-medium text-[11px] transition-colors cursor-pointer border border-border-subtle"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant italic">
                                Pending review
                              </span>
                            )
                          ) : req.status === 'APPROVED' ? (
                            (isTeamAdmin || isSuperAdmin) ? (
                              <button
                                type="button"
                                onClick={() => setConfirmRevokeReq(req)}
                                className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-label-bold text-[11px] transition-colors cursor-pointer border border-red-200"
                              >
                                Revoke Early
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">Active</span>
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
          </>
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
              {/* Permission / Capability */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Target Permission / Capability *
                </label>
                {permissionsCatalog.length > 0 ? (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
                  >
                    {permissionsCatalog.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.key} {p.category ? `(${p.category.replace(/_/g, ' ')})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface-variant">
                    Loading permissions…
                  </div>
                )}
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
