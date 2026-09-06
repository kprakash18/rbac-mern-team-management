import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import * as jitApi from '../api/jitApi';
import { SUPER_ADMIN_ONLY_PERMISSIONS } from '../constants/jitConstants';

export function useJitRequests({ teamId, currentUserId, showToast }) {
  const [requests, setRequests] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [requesterFilter, setRequesterFilter] = useState('ALL');

  const fetchRequestsAndCatalog = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [rawRequests, rawPerms] = await Promise.all([
        jitApi.getAccessRequests(teamId).catch(() => []),
        jitApi.getTeamPermissionsCatalog().catch(() => []),
      ]);

      const formatted = rawRequests.map((r) => {
        const reqUser = (r.requesterId && typeof r.requesterId === 'object') ? r.requesterId : {};
        const perm = (r.permissionId && typeof r.permissionId === 'object') ? r.permissionId : {};
        const name = reqUser.name || reqUser.email || 'Member';
        const durationLabel = r.durationHours
          ? (r.durationHours < 1 ? `${Math.round(r.durationHours * 60)}m` : `${r.durationHours}h`)
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

      const teamPerms = rawPerms.filter((p) => !SUPER_ADMIN_ONLY_PERMISSIONS.has(p.key));
      setPermissionsCatalog(teamPerms);
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchRequestsAndCatalog();
  }, [fetchRequestsAndCatalog]);

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

  const approveRequest = async (reqId, currentUserName) => {
    if (!teamId) return;
    try {
      await jitApi.approveAccessRequest(teamId, reqId);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'APPROVED',
                statusLabel: 'Active',
                approvedBy: currentUserName || 'Admin',
              }
            : r
        )
      );
      showToast?.('JIT access request approved. Lease is now active.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to approve request:', err);
      showToast?.(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to approve request.', 'error');
    }
  };

  const rejectRequest = async (reqId, rejectReason) => {
    if (!teamId) return;
    try {
      await jitApi.rejectAccessRequest(teamId, reqId, rejectReason || 'Rejected by Team Admin.');
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
      showToast?.('JIT access request rejected.', 'error');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to reject request:', err);
      showToast?.(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to reject request.', 'error');
    }
  };

  const revokeRequest = async (reqId) => {
    if (!teamId) return;
    try {
      await jitApi.revokeAccessRequest(teamId, reqId);
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
      showToast?.('Active JIT lease revoked early.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to revoke request:', err);
      showToast?.(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to revoke grant.', 'error');
    }
  };

  const withdrawRequest = async (reqId) => {
    if (!teamId) return;
    try {
      await jitApi.deleteAccessRequest(teamId, reqId);
      setRequests((prev) => prev.filter((r) => r.id !== reqId && r._id !== reqId));
      showToast?.('Access request withdrawn successfully.');
    } catch (err) {
      console.error('Failed to withdraw request:', err);
      showToast?.(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to withdraw request.', 'error');
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestedRoleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.justification.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? r.status === 'PENDING'
        : statusFilter === 'APPROVED'
        ? r.status === 'APPROVED'
        : ['EXPIRED', 'REVOKED', 'REJECTED', 'CANCELLED'].includes(r.status);

    const matchesRequester =
      requesterFilter === 'ALL'
        ? true
        : r.requesterId === currentUserId || r.memberId === currentUserId;

    return matchesSearch && matchesStatus && matchesRequester;
  });

  return {
    requests,
    setRequests,
    permissionsCatalog,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    requesterFilter,
    setRequesterFilter,
    filteredRequests,
    fetchRequestsAndCatalog,
    approveRequest,
    rejectRequest,
    revokeRequest,
    withdrawRequest,
  };
}
