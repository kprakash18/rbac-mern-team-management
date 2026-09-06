import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { useWorkspace } from '@/context/useWorkspace';
import { useToast } from '@/lib/useToast';

export function useJitRequests(teamId, currentUser) {
  const { can, refetchBootstrap } = useWorkspace();
  const currentUserId = currentUser?._id || currentUser?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin) || can('team.admin') || can('role.assign');
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  const canApprove = can('access_request.approve') || isSuperAdmin || isTeamAdmin;
  const canApproveAll = isSuperAdmin;

  const [requests, setRequests] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'PAST'
  const [requesterFilter, setRequesterFilter] = useState('ALL'); // 'ALL' | 'ME'

  // Modal State
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
  const [toast, showToast] = useToast();

  const fetchRequestsAndCatalog = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const reqsPromise = api.get(`/api/teams/${teamId}/access-requests`);
      const permsPromise = permissionsCatalog.length === 0 ? api.get('/api/permissions') : Promise.resolve(null);

      const [reqsRes, permsRes] = await Promise.allSettled([reqsPromise, permsPromise]);

      if (reqsRes.status === 'fulfilled') {
        const raw = reqsRes.value.data?.data?.accessRequests || reqsRes.value.data?.data || [];
        const formatted = raw.map((r) => {
          const reqUser = r.requesterId && typeof r.requesterId === 'object' ? r.requesterId : {};
          const perm = r.permissionId && typeof r.permissionId === 'object' ? r.permissionId : {};
          const name = reqUser.name || reqUser.email || 'Member';
          const durationLabel = r.durationHours
            ? r.durationHours < 1
              ? `${Math.round(r.durationHours * 60)}m`
              : `${r.durationHours}h`
            : r.durationMinutes
            ? `${r.durationMinutes}m`
            : '—';
          return {
            ...r,
            id: r._id || r.id,
            _id: r._id || r.id,
            memberName: name,
            memberInitials: name.slice(0, 2).toUpperCase(),
            memberEmail: reqUser.email || '',
            memberId: reqUser._id?.toString() || reqUser.id?.toString() || (typeof r.requesterId === 'string' ? r.requesterId : ''),
            requesterId: reqUser._id?.toString() || reqUser.id?.toString() || (typeof r.requesterId === 'string' ? r.requesterId : ''),
            requestedRoleLabel: perm.key || perm.name || 'Custom Permission',
            roleKey: perm.key || 'permission',
            risk: perm.category === 'Security' || perm.category === 'Admin' ? 'High' : 'Medium',
            riskLevel: perm.category === 'Security' || perm.category === 'Admin' ? 'High' : 'Medium',
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
            approvalLevel: r.approvalLevel || 'TEAM_ADMIN',
            needsSuperAdminApproval: r.approvalLevel === 'SUPER_ADMIN',
          };
        });
        setRequests(formatted);
      }

      if (permsRes.status === 'fulfilled' && permsRes.value) {
        const rawPerms = permsRes.value.data?.data?.permissions || permsRes.value.data?.data || [];
        setPermissionsCatalog(rawPerms);
        if (rawPerms.length > 0 && !selectedRole) {
          setSelectedRole(rawPerms[0]._id || rawPerms[0].key);
        }
      }
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId, permissionsCatalog.length, selectedRole]);

  useEffect(() => {
    fetchRequestsAndCatalog();
  }, [fetchRequestsAndCatalog]);

  // Real-time socket listeners
  useEffect(() => {
    if (!teamId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleRequestCreated = ({ accessRequest }) => {
      if (!accessRequest) return;
      fetchRequestsAndCatalog();
    };

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
                  status === 'APPROVED'
                    ? 'Active'
                    : status === 'REJECTED'
                    ? 'Rejected'
                    : status === 'REVOKED'
                    ? 'Revoked Early'
                    : status === 'CANCELLED'
                    ? 'Cancelled'
                    : status,
              }
            : r
        )
      );
    };

    const handleGrantRevoked = ({ requestId }) => {
      const matchId = String(requestId || '');
      if (!matchId) {
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

  const handleApprove = useCallback(
    async (reqId) => {
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
        refetchBootstrap?.(true);
      } catch (err) {
        console.error('Failed to approve request:', err);
        showToast(
          err.response?.data?.message || err.response?.data?.error?.message || 'Failed to approve request.',
          'error'
        );
      }
    },
    [teamId, currentUser, showToast, fetchRequestsAndCatalog, refetchBootstrap]
  );

  const handleConfirmReject = useCallback(async () => {
    if (!confirmRejectReq || !teamId) return;
    const reqId = confirmRejectReq.id;
    try {
      await api.post(`/api/teams/${teamId}/access-requests/${reqId}/reject`, {
        reason: rejectReason || 'Rejected by Team Admin.',
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId ? { ...r, status: 'REJECTED', statusLabel: 'Rejected', rejectReason } : r
        )
      );
      setConfirmRejectReq(null);
      showToast('JIT access request was rejected.', 'error');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to reject request:', err);
      showToast(err.response?.data?.message || 'Failed to reject request.', 'error');
    }
  }, [confirmRejectReq, teamId, rejectReason, showToast, fetchRequestsAndCatalog]);

  const handleConfirmRevoke = useCallback(async () => {
    if (!confirmRevokeReq || !teamId) return;
    const grantId = confirmRevokeReq.grantId || confirmRevokeReq.id;
    try {
      await api.delete(`/api/teams/${teamId}/access-grants/${grantId}`);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === confirmRevokeReq.id ? { ...r, status: 'REVOKED', statusLabel: 'Revoked Early' } : r
        )
      );
      setConfirmRevokeReq(null);
      showToast('JIT access lease was revoked.');
      fetchRequestsAndCatalog();
      refetchBootstrap?.(true);
    } catch (err) {
      console.error('Failed to revoke grant:', err);
      showToast(err.response?.data?.message || 'Failed to revoke lease.', 'error');
    }
  }, [confirmRevokeReq, teamId, showToast, fetchRequestsAndCatalog, refetchBootstrap]);

  const handleConfirmWithdraw = useCallback(async () => {
    if (!confirmWithdrawReq || !teamId) return;
    const reqId = confirmWithdrawReq.id || confirmWithdrawReq._id;
    try {
      await api.delete(`/api/teams/${teamId}/access-requests/${reqId}`);
      setRequests((prev) => prev.filter((r) => r.id !== reqId && r._id !== reqId));
      setConfirmWithdrawReq(null);
      showToast('JIT access request cancelled.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to withdraw request:', err);
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to cancel request.', 'error');
    }
  }, [confirmWithdrawReq, teamId, showToast, fetchRequestsAndCatalog]);

  const handleStartEditRequest = useCallback((req) => {
    setEditingRequest(req);
    setEditTicketId(req.ticketId || '');
    setEditJustification(req.justification || req.reason || '');
    const dMap = { '30m': '30m', '1h': '1h', '2h': '2h', '4h': '4h', '8h': '8h' };
    setEditDuration(dMap[req.requestedDuration] || '2h');
  }, []);

  const handleSaveEditRequest = useCallback(async (e) => {
    e.preventDefault();
    if (!editingRequest || !teamId) return;
    const reqId = editingRequest.id || editingRequest._id;
    try {
      setSubmitting(true);
      const payload = {
        ticketId: editTicketId.trim(),
        reason: editJustification.trim(),
        durationHours: editDuration.endsWith('m')
          ? parseInt(editDuration, 10) / 60
          : parseInt(editDuration, 10),
      };
      await api.patch(`/api/teams/${teamId}/access-requests/${reqId}`, payload);
      setEditingRequest(null);
      showToast('JIT access request updated successfully.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to update request:', err);
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update request.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editingRequest, teamId, editTicketId, editJustification, editDuration, showToast, fetchRequestsAndCatalog]);

  const handleCreateRequest = useCallback(async (e) => {
    e.preventDefault();
    if (!teamId) return;
    try {
      setSubmitting(true);
      const permObj = permissionsCatalog.find(
        (p) => p._id === selectedRole || p.key === selectedRole
      );
      const permKey = permObj?.key || selectedRole;

      const durationHours = duration.endsWith('m')
        ? parseInt(duration, 10) / 60
        : parseInt(duration, 10);

      await api.post(`/api/teams/${teamId}/access-requests`, {
        permissionKey: permKey,
        durationHours,
        reason: justification.trim(),
        ticketId: ticketId.trim() || undefined,
      });

      setIsModalOpen(false);
      setJustification('');
      setTicketId('');
      showToast('JIT access request submitted successfully.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to create JIT request:', err);
      showToast(
        err.response?.data?.error?.message || err.response?.data?.message || 'Failed to submit request.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }, [teamId, permissionsCatalog, selectedRole, duration, justification, ticketId, showToast, fetchRequestsAndCatalog]);

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.memberEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedRoleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && r.status === 'PENDING') ||
      (statusFilter === 'APPROVED' && r.status === 'APPROVED') ||
      (statusFilter === 'PAST' &&
        (r.status === 'EXPIRED' || r.status === 'REVOKED' || r.status === 'REJECTED' || r.status === 'CANCELLED'));

    const matchesRequester = requesterFilter === 'ALL' || r.memberId === currentUserId;

    return matchesSearch && matchesStatus && matchesRequester;
  });

  return {
    requests,
    filteredRequests,
    permissionsCatalog,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    requesterFilter,
    setRequesterFilter,
    isModalOpen,
    setIsModalOpen,
    confirmRevokeReq,
    setConfirmRevokeReq,
    confirmRejectReq,
    setConfirmRejectReq,
    confirmWithdrawReq,
    setConfirmWithdrawReq,
    editingRequest,
    setEditingRequest,
    editTicketId,
    setEditTicketId,
    editJustification,
    setEditJustification,
    editDuration,
    setEditDuration,
    rejectReason,
    setRejectReason,
    selectedRole,
    setSelectedRole,
    duration,
    setDuration,
    ticketId,
    setTicketId,
    justification,
    setJustification,
    submitting,
    toast,
    canApprove,
    canApproveAll,
    currentUserId,
    handleApprove,
    handleConfirmReject,
    handleConfirmRevoke,
    handleConfirmWithdraw,
    handleStartEditRequest,
    handleSaveEditRequest,
    handleCreateRequest,
    refresh: fetchRequestsAndCatalog,
  };
}
