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
import api from '@/lib/api';

export default function JitAccessView() {
  const [activeTab, setActiveTab] = useState('active');
  const [grants, setGrants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [history, setHistory] = useState([]);

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
      const teamsRes = await api.get('/api/teams');
      const teams = teamsRes.data?.data?.teams || teamsRes.data?.data || [];
      if (teams.length > 0) {
        const teamId = teams[0]._id || teams[0].id;
        const res = await api.get(`/api/teams/${teamId}/access-requests`);
        const requests = Array.isArray(res.data?.data) ? res.data?.data : [];

        const pending = requests.filter((r) => r.status === 'PENDING').map((r) => ({
          id: r._id || r.id,
          user: {
            name: r.userId?.name || 'Developer',
            email: r.userId?.email || 'dev@example.com',
            initials: (r.userId?.name || 'DV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          },
          workspace: teams[0].name,
          role: r.targetRole || 'Elevated Access',
          justification: r.justification || r.reason || 'Operational task',
          duration: `${r.durationMinutes || 60}m`,
          requestedAt: r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : 'Just now',
          timeRemainingSec: (r.durationMinutes || 60) * 60,
        }));

        const active = requests.filter((r) => r.status === 'APPROVED' || r.status === 'ACTIVE').map((r) => ({
          id: r._id || r.id,
          user: {
            name: r.userId?.name || 'Developer',
            email: r.userId?.email || 'dev@example.com',
            initials: (r.userId?.name || 'DV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          },
          workspace: teams[0].name,
          role: r.targetRole || 'Elevated Access',
          grantedBy: r.approvedBy?.name || 'System Admin',
          grantedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString() : 'Just now',
          timeRemainingSec: 3600,
          totalDurationSec: 3600,
        }));

        const hist = requests.filter((r) => ['REJECTED', 'EXPIRED', 'REVOKED'].includes(r.status)).map((r) => ({
          id: r._id || r.id,
          user: {
            name: r.userId?.name || 'Developer',
            email: r.userId?.email || 'dev@example.com',
            initials: (r.userId?.name || 'DV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          },
          workspace: teams[0].name,
          role: r.targetRole || 'Elevated Access',
          status: r.status,
          decisionBy: r.approvedBy?.name || 'System Admin',
          decisionAt: r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString() : 'Just now',
        }));

        setPendingRequests(pending);
        setGrants(active);
        setHistory(hist);
      }
    } catch (err) {
      console.warn('Failed to load JIT requests:', err);
    }
  }, []);

  useEffect(() => {
    fetchJitRequests();
  }, [fetchJitRequests]);

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

  const handleRevokeGrant = (grantId) => {
    const targetGrant = grants.find((g) => g.id === grantId);
    if (!targetGrant) return;

    setGrants((prev) => prev.filter((g) => g.id !== grantId));

    // Append to audit history
    const revokedRecord = {
      id: `hist-${Date.now()}`,
      user: targetGrant.user,
      workspace: targetGrant.workspace,
      permission: targetGrant.permission,
      permBadgeClass: targetGrant.permBadgeClass,
      targetResource: targetGrant.targetResource,
      grantedBy: 'Super Admin',
      outcome: 'REVOKED',
      outcomeClass: 'bg-error-bg text-error-text border-error-container',
      duration: `${Math.round((targetGrant.totalSeconds - targetGrant.remainingSeconds) / 60)} Mins Active`,
      endedAt: 'Just now',
      reason: 'Prematurely revoked by Super Admin.',
    };

    setHistory((prev) => [revokedRecord, ...prev]);
    showToast(`JIT grant for ${targetGrant.user.name} (${targetGrant.permission}) was revoked.`);
  };

  const handleApproveRequest = (request) => {
    // Remove from pending
    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));

    // Convert requested duration to seconds
    let totalSeconds = 3600;
    if (request.requestedDuration?.includes('4')) totalSeconds = 14400;
    else if (request.requestedDuration?.includes('2')) totalSeconds = 7200;

    // Create new active grant
    const newGrant = {
      id: `grant-${Date.now()}`,
      user: request.user,
      workspace: request.workspace,
      permission: request.permission,
      permBadgeClass: request.permBadgeClass,
      targetResource: request.targetResource,
      grantedBy: 'Super Admin',
      totalSeconds,
      remainingSeconds: totalSeconds,
    };

    setGrants((prev) => [newGrant, ...prev]);
    showToast(`Approved elevation request for ${request.user.name} (${request.permission}).`);
  };

  const handleConfirmReject = (requestId, reason) => {
    const targetReq = pendingRequests.find((r) => r.id === requestId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

    if (targetReq) {
      const rejectedRecord = {
        id: `hist-${Date.now()}`,
        user: targetReq.user,
        workspace: targetReq.workspace,
        permission: targetReq.permission,
        permBadgeClass: targetReq.permBadgeClass,
        targetResource: targetReq.targetResource,
        grantedBy: 'Super Admin',
        outcome: 'REJECTED',
        outcomeClass: 'bg-warning-bg text-warning-text border-warning-bg',
        duration: '0 Mins',
        endedAt: 'Just now',
        reason: `Rejected: ${reason}`,
      };
      setHistory((prev) => [rejectedRecord, ...prev]);
    }

    showToast(`Access request rejected: ${reason}`);
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
          <h1 className="font-display-title text-display-title text-on-surface">JIT Access Grants</h1>
          <p className="font-body-base text-body-base text-on-surface-variant">
            Temporary elevated permissions with live TTL and audit logs.
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
          onClick={() => setActiveTab('pending')}
          className={`px-md py-sm border-b-2 font-label-bold text-label-bold flex items-center gap-xs transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          Pending Requests
          {filteredRequests.length > 0 && (
            <span className="bg-error-container text-on-error-container px-xs rounded-full font-label-sm text-label-sm ml-xs">
              {filteredRequests.length}
            </span>
          )}
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
      {activeTab === 'active' ? (
        <ActiveGrantsTable grants={filteredGrants} onRevokeGrant={handleRevokeGrant} />
      ) : activeTab === 'pending' ? (
        <PendingRequestsTable
          requests={filteredRequests}
          onSelectRequest={setSelectedRequestDetails}
          onApproveRequest={handleApproveRequest}
          onOpenRejectModal={setRejectingRequest}
        />
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
