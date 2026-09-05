import { useState, useEffect, useCallback } from 'react';
import ActiveGrantsTable from './jit/ActiveGrantsTable.jsx';
import PendingRequestsTable from './jit/PendingRequestsTable.jsx';
import JitHistoryTable from './jit/JitHistoryTable.jsx';
import NewGrantModal from './jit/NewGrantModal.jsx';
import ConfirmModal from '../../../components/shared/ConfirmModal.jsx';
import RequestDetailsModal from './jit/RequestDetailsModal.jsx';
import JitFilterModal from './jit/JitFilterModal.jsx';
import Toast from '../../../components/shared/Toast.jsx';
import { useToast } from '../../../lib/useToast.js';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';

export default function JitAccessView() {
  const [activeTab, setActiveTab] = useState('pending');
  const [grants, setGrants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterWorkspace, setFilterWorkspace] = useState('ALL');
  const [filterPermission, setFilterPermission] = useState('ALL');

  // Modals
  const [isNewGrantOpen, setIsNewGrantOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('Insufficient business justification or outside operational window.');
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  // Toast notification
  const [toast, showToast] = useToast(3500);

  const fetchJitRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/access-requests?limit=100');
      const requests = Array.isArray(res.data?.data) ? res.data?.data : [];

      const pending = requests
        .filter((r) => r.status === 'PENDING')
        .map((r) => {
          const reqUser = r.requesterId && typeof r.requesterId === 'object' ? r.requesterId : {};
          const perm = r.permissionId && typeof r.permissionId === 'object' ? r.permissionId : {};
          const team = r.teamId && typeof r.teamId === 'object' ? r.teamId : {};
          const name = reqUser.name || reqUser.email || 'Team Admin';
          const durationLabel = r.durationHours
            ? (r.durationHours < 1 ? `${Math.round(r.durationHours * 60)}m` : `${r.durationHours}h`)
            : `${r.durationMinutes || 120}m`;

          return {
            id: r._id || r.id,
            _id: r._id || r.id,
            user: {
              name,
              email: reqUser.email || '',
              initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'TA',
              bgClass: 'bg-primary-container text-on-primary',
            },
            workspace: team.name || 'Workspace',
            teamId: team._id || r.teamId,
            permission: perm.name || perm.key || 'Custom Permission',
            permBadgeClass: 'bg-primary/10 text-primary border-primary/20',
            targetResource: r.resource || '*',
            reason: r.reason || 'Operational task',
            justification: r.reason || 'Operational task',
            requestedDuration: durationLabel,
            submittedAt: r.createdAt
              ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            timeRemainingSec: (r.durationHours || 2) * 3600,
            approvalLevel: r.approvalLevel || 'SUPER_ADMIN',
          };
        });

      const active = requests
        .filter((r) => r.status === 'APPROVED' || r.status === 'ACTIVE')
        .map((r) => {
          const reqUser = r.requesterId && typeof r.requesterId === 'object' ? r.requesterId : {};
          const perm = r.permissionId && typeof r.permissionId === 'object' ? r.permissionId : {};
          const team = r.teamId && typeof r.teamId === 'object' ? r.teamId : {};
          const reviewer = r.reviewedBy && typeof r.reviewedBy === 'object' ? r.reviewedBy : {};
          const name = reqUser.name || reqUser.email || 'Team Admin';
          const remainingSeconds = r.expiresAt
            ? Math.max(0, Math.floor((new Date(r.expiresAt) - new Date()) / 1000))
            : 3600;

          return {
            id: r._id || r.id,
            _id: r._id || r.id,
            user: {
              name,
              email: reqUser.email || '',
              initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'TA',
              bgClass: 'bg-primary-container text-on-primary',
            },
            workspace: team.name || 'Workspace',
            teamId: team._id || r.teamId,
            permission: perm.name || perm.key || 'Custom Permission',
            permBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            targetResource: r.resource || '*',
            grantedBy: reviewer.name || 'Super Admin',
            grantedAt: r.reviewedAt || r.updatedAt
              ? new Date(r.reviewedAt || r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            remainingSeconds,
            totalSeconds: (r.durationHours || 2) * 3600,
          };
        });

      const hist = requests
        .filter((r) => ['REJECTED', 'EXPIRED', 'REVOKED'].includes(r.status))
        .map((r) => {
          const reqUser = r.requesterId && typeof r.requesterId === 'object' ? r.requesterId : {};
          const perm = r.permissionId && typeof r.permissionId === 'object' ? r.permissionId : {};
          const team = r.teamId && typeof r.teamId === 'object' ? r.teamId : {};
          const reviewer = r.reviewedBy && typeof r.reviewedBy === 'object' ? r.reviewedBy : {};
          const name = reqUser.name || reqUser.email || 'Team Admin';

          return {
            id: r._id || r.id,
            _id: r._id || r.id,
            user: {
              name,
              email: reqUser.email || '',
              initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'TA',
              bgClass: 'bg-surface-container-high text-on-surface',
            },
            workspace: team.name || 'Workspace',
            permission: perm.name || perm.key || 'Custom Permission',
            permBadgeClass: 'bg-surface-container text-on-surface border-border-subtle',
            targetResource: r.resource || '*',
            grantedBy: reviewer.name || 'Super Admin',
            outcome: r.status,
            outcomeClass:
              r.status === 'REJECTED'
                ? 'bg-warning-bg text-warning-text border-warning-bg'
                : r.status === 'REVOKED'
                ? 'bg-error-bg text-error-text border-error-container'
                : 'bg-surface-variant text-on-surface-variant border-surface-variant',
            duration: `${r.durationHours || 2}h`,
            endedAt: r.updatedAt
              ? new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            reason: r.rejectionReason || 'Closed',
          };
        });

      setPendingRequests(pending);
      setGrants(active);
      setHistory(hist);
    } catch (err) {
      console.warn('Failed to load JIT requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJitRequests();
  }, [fetchJitRequests]);

  // Real-time socket listeners for incoming JIT elevation requests from Team Admins
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onReqCreated = () => {
      fetchJitRequests();
      showToast('New JIT Access Request received from Team Admin.', 'info');
    };

    const onReqResolved = () => {
      fetchJitRequests();
    };

    const onGrantRevoked = () => {
      fetchJitRequests();
    };

    socket.on('access_request:created', onReqCreated);
    socket.on('access_request:resolved', onReqResolved);
    socket.on('access_grant:revoked', onGrantRevoked);

    return () => {
      socket.off('access_request:created', onReqCreated);
      socket.off('access_request:resolved', onReqResolved);
      socket.off('access_grant:revoked', onGrantRevoked);
    };
  }, [fetchJitRequests, showToast]);

  // Real-time ticking timer for active grants with automatic expiration transition
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setGrants((prevGrants) => {
        const remainingGrants = [];
        const newlyExpiredGrants = [];

        prevGrants.forEach((grant) => {
          if (grant.remainingSeconds > 1) {
            remainingGrants.push({
              ...grant,
              remainingSeconds: grant.remainingSeconds - 1,
            });
          } else {
            newlyExpiredGrants.push({
              id: `hist-${Date.now()}-${grant.id}`,
              user: grant.user,
              workspace: grant.workspace,
              permission: grant.permission,
              permBadgeClass: grant.permBadgeClass,
              targetResource: grant.targetResource,
              grantedBy: grant.grantedBy,
              outcome: 'EXPIRED',
              outcomeClass: 'bg-surface-variant text-on-surface-variant border-surface-variant',
              duration: `${Math.round((grant.totalSeconds || 3600) / 60)} Mins`,
              endedAt: 'Just now',
              reason: 'TTL duration elapsed automatically.',
            });
          }
        });

        if (newlyExpiredGrants.length > 0) {
          setHistory((prevHist) => [...newlyExpiredGrants, ...prevHist]);
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
      showToast(`JIT request rejected. Notification sent to Team Admin.`);
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

  // Filtered views
  const filteredGrants = grants.filter((g) => {
    const matchWs = filterWorkspace === 'ALL' || g.workspace === filterWorkspace;
    const matchPerm = filterPermission === 'ALL' || g.permission === filterPermission;
    return matchWs && matchPerm;
  });

  const filteredRequests = pendingRequests.filter((r) => {
    const matchWs = filterWorkspace === 'ALL' || r.workspace === filterWorkspace;
    const matchPerm = filterPermission === 'ALL' || r.permission === filterPermission;
    return matchWs && matchPerm;
  });

  const filteredHistory = history.filter((h) => {
    const matchWs = filterWorkspace === 'ALL' || h.workspace === filterWorkspace;
    const matchPerm = filterPermission === 'ALL' || h.permission === filterPermission;
    return matchWs && matchPerm;
  });

  const hasActiveFilter = filterWorkspace !== 'ALL' || filterPermission !== 'ALL';

  return (
    <div className="flex flex-col w-full p-xl gap-xl">
      {/* Toast Notification */}
      <div className="fixed top-6 right-6 z-1200">
        <Toast message={toast?.msg} type={toast?.type} />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
        <div className="flex flex-col gap-base">
          <h1 className="font-display-title text-display-title text-on-surface">JIT Access Governance</h1>
          <p className="font-body-base text-body-base text-on-surface-variant">
            Inspect, approve, and manage Just-In-Time elevation requests from Team Admins across all teams.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            className={`px-md py-sm rounded-lg font-label-bold text-label-bold flex items-center gap-xs transition-colors cursor-pointer ${
              hasActiveFilter
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
            onClick={() => setIsFilterModalOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filter</span>
            {hasActiveFilter && (
              <span className="w-2 h-2 rounded-full bg-warning-text ml-0.5"></span>
            )}
          </button>
          <button
            type="button"
            className="px-md py-sm rounded-lg bg-primary text-on-primary font-label-bold text-label-bold flex items-center gap-xs hover:bg-on-primary-fixed transition-colors cursor-pointer shadow-xs"
            onClick={() => setIsNewGrantOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Grant
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-md border-b border-surface-variant mb-md">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-md py-sm border-b-2 font-label-bold text-label-bold flex items-center gap-xs transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          Pending Team Admin Requests
          {filteredRequests.length > 0 && (
            <span className="bg-error-container text-on-error-container px-xs rounded-full font-label-sm text-label-sm ml-xs">
              {filteredRequests.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-md py-sm border-b-2 font-label-bold text-label-bold flex items-center gap-xs transition-colors cursor-pointer ${
            activeTab === 'active'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">timer</span>
          Active Grants
          <span className="bg-surface-container text-on-surface px-1.5 py-0.5 rounded-full text-[11px] ml-xs">
            {filteredGrants.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-md py-sm border-b-2 font-label-bold text-label-bold flex items-center gap-xs transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          Audit History
          <span className="bg-surface-container text-on-surface px-1.5 py-0.5 rounded-full text-[11px] ml-xs">
            {filteredHistory.length}
          </span>
        </button>
      </div>

      {/* Filter Active Badge Bar */}
      {hasActiveFilter && (
        <div className="flex items-center gap-xs px-sm py-1 bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant">
          <span>Active Filters:</span>
          {filterWorkspace !== 'ALL' && (
            <span className="font-semibold text-primary bg-card-bg px-2 py-0.5 rounded border border-border-subtle">
              Workspace: {filterWorkspace}
            </span>
          )}
          {filterPermission !== 'ALL' && (
            <span className="font-semibold text-primary bg-card-bg px-2 py-0.5 rounded border border-border-subtle">
              Permission: {filterPermission}
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto text-[11px] text-error hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Tables based on active tab */}
      {loading ? (
        <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
          <span className="text-body-sm">Loading JIT elevation requests...</span>
        </div>
      ) : activeTab === 'pending' ? (
        <PendingRequestsTable
          requests={filteredRequests}
          onSelectRequest={setSelectedRequestDetails}
          onApproveRequest={handleApproveRequest}
          onOpenRejectModal={setRejectingRequest}
        />
      ) : activeTab === 'active' ? (
        <ActiveGrantsTable grants={filteredGrants} onRevokeGrant={handleRevokeGrant} />
      ) : (
        <JitHistoryTable history={filteredHistory} />
      )}

      {/* Review Request Details Modal */}
      <RequestDetailsModal
        request={selectedRequestDetails}
        onClose={() => setSelectedRequestDetails(null)}
        onApprove={handleApproveRequest}
        onOpenReject={setRejectingRequest}
      />

      {/* Direct New Grant Modal */}
      <NewGrantModal
        isOpen={isNewGrantOpen}
        onClose={() => setIsNewGrantOpen(false)}
        onSubmit={handleCreateGrant}
      />

      {/* Reject Request Modal */}
      {rejectingRequest && (
        <ConfirmModal
          isOpen={Boolean(rejectingRequest)}
          title="Reject Access Request"
          confirmText="Confirm Rejection"
          confirmVariant="danger"
          icon="cancel"
          onClose={() => setRejectingRequest(null)}
          onConfirm={() => {
            handleConfirmReject(rejectingRequest.id, rejectReason);
            setRejectingRequest(null);
          }}
        >
          <div className="space-y-3 text-[13px]">
            <div className="p-2.5 bg-surface-container-low rounded-lg text-[12px] text-on-surface space-y-1">
              <div>
                <strong>Requester:</strong> {rejectingRequest.user?.name} ({rejectingRequest.user?.email})
              </div>
              <div>
                <strong>Requested Perm:</strong>{' '}
                <span className="font-mono">{rejectingRequest.permission}</span> on{' '}
                <span className="font-mono">{rejectingRequest.targetResource}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                Reason for Rejection
              </label>
              <textarea
                required
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
                placeholder="Explain why this request is being rejected..."
              />
            </div>
          </div>
        </ConfirmModal>
      )}

      {/* Filter Modal */}
      <JitFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterWorkspace={filterWorkspace}
        setFilterWorkspace={setFilterWorkspace}
        filterPermission={filterPermission}
        setFilterPermission={setFilterPermission}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
