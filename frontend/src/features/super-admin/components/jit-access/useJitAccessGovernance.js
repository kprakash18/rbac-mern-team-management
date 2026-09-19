import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/lib/useToast';
import {
  getExpiredHistoryItem,
  normalizeActiveGrant,
  normalizeHistoryItem,
  normalizePendingRequest,
} from './jitAccessModel';

const DEFAULT_REJECT_REASON = 'Insufficient business justification or outside operational window.';

export function useJitAccessGovernance() {
  const [activeTab, setActiveTab] = useState('pending');
  const [grants, setGrants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterWorkspace, setFilterWorkspace] = useState('ALL');
  const [filterPermission, setFilterPermission] = useState('ALL');
  const [isNewGrantOpen, setIsNewGrantOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState(DEFAULT_REJECT_REASON);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [toast, showToast] = useToast(3500);

  const fetchJitRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/access-requests?limit=100');
      const requests = Array.isArray(res.data?.data) ? res.data?.data : [];
      setPendingRequests(requests.filter((request) => request.status === 'PENDING').map(normalizePendingRequest));
      setGrants(requests.filter((request) => request.status === 'APPROVED' || request.status === 'ACTIVE').map(normalizeActiveGrant));
      setHistory(requests.filter((request) => ['REJECTED', 'EXPIRED', 'REVOKED'].includes(request.status)).map(normalizeHistoryItem));
    } catch (err) {
      console.warn('Failed to load JIT requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJitRequests();
  }, [fetchJitRequests]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onRequestCreated = () => {
      fetchJitRequests();
      showToast('New JIT Access Request received from Team Admin.', 'info');
    };
    const onRequestResolved = () => fetchJitRequests();
    const onGrantRevoked = () => fetchJitRequests();

    socket.on('access_request:created', onRequestCreated);
    socket.on('access_request:resolved', onRequestResolved);
    socket.on('access_grant:revoked', onGrantRevoked);

    return () => {
      socket.off('access_request:created', onRequestCreated);
      socket.off('access_request:resolved', onRequestResolved);
      socket.off('access_grant:revoked', onGrantRevoked);
    };
  }, [fetchJitRequests, showToast]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setGrants((prevGrants) => {
        const remainingGrants = [];
        const newlyExpiredGrants = [];

        prevGrants.forEach((grant) => {
          if (grant.remainingSeconds > 1) {
            remainingGrants.push({ ...grant, remainingSeconds: grant.remainingSeconds - 1 });
          } else {
            newlyExpiredGrants.push(getExpiredHistoryItem(grant));
          }
        });

        if (newlyExpiredGrants.length > 0) {
          setHistory((prevHistory) => [...newlyExpiredGrants, ...prevHistory]);
        }

        return remainingGrants;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const handleRevokeGrant = async (grantId) => {
    try {
      await api.delete(`/api/access-requests/${grantId}/revoke`);
      showToast('JIT grant revoked early.');
      fetchJitRequests();
    } catch (err) {
      console.error('Failed to revoke grant:', err);
      showToast(err.response?.data?.message || 'Failed to revoke JIT grant.', 'error');
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      await api.post(`/api/access-requests/${request.id}/approve`);
      showToast(`Approved JIT request for ${request.user.name} (${request.permission}). Notification sent to Team Admin.`);
      fetchJitRequests();
    } catch (err) {
      console.error('Failed to approve request:', err);
      showToast(err.response?.data?.message || 'Failed to approve request.', 'error');
    }
  };

  const handleConfirmReject = async (requestId, reason) => {
    try {
      await api.post(`/api/access-requests/${requestId}/reject`, { reason });
      showToast('JIT request rejected. Notification sent to Team Admin.');
      fetchJitRequests();
    } catch (err) {
      console.error('Failed to reject request:', err);
      showToast(err.response?.data?.message || 'Failed to reject request.', 'error');
    }
  };

  const handleCreateGrant = (newGrant) => {
    setGrants((prev) => [newGrant, ...prev]);
    showToast(`Issued JIT grant for ${newGrant.user.name} (${newGrant.permission}).`);
  };

  const handleResetFilters = () => {
    setFilterWorkspace('ALL');
    setFilterPermission('ALL');
    setIsFilterModalOpen(false);
    showToast('Filters reset to show all items.');
  };

  const applyFilters = (items) => items.filter((item) => {
    const matchWorkspace = filterWorkspace === 'ALL' || item.workspace === filterWorkspace;
    const matchPermission = filterPermission === 'ALL' || item.permission === filterPermission;
    return matchWorkspace && matchPermission;
  });

  return {
    activeTab,
    filterPermission,
    filterWorkspace,
    filteredGrants: applyFilters(grants),
    filteredHistory: applyFilters(history),
    filteredRequests: applyFilters(pendingRequests),
    hasActiveFilter: filterWorkspace !== 'ALL' || filterPermission !== 'ALL',
    isFilterModalOpen,
    isNewGrantOpen,
    loading,
    rejectReason,
    rejectingRequest,
    selectedRequestDetails,
    toast,
    handleApproveRequest,
    handleConfirmReject,
    handleCreateGrant,
    handleResetFilters,
    handleRevokeGrant,
    setActiveTab,
    setFilterPermission,
    setFilterWorkspace,
    setIsFilterModalOpen,
    setIsNewGrantOpen,
    setRejectingRequest,
    setRejectReason,
    setSelectedRequestDetails,
  };
}
