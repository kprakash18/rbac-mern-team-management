import { useApp } from '@/context/useApp';
import { useJitRequests } from './useJitRequests';
import JitRequestTable from './components/JitRequestTable';
import CreateJitModal from './components/CreateJitModal';
import EditJitModal from './components/EditJitModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Toast from '@/components/shared/Toast';
import SearchInput from '@/components/shared/SearchInput';

export default function JitRequestView({ currentUser, workspace }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);

  const {
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
  } = useJitRequests(teamId, currentUser);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const activeCount = requests.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Toast Notification */}
      <Toast message={toast?.msg} type={toast?.type} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            JIT Access Requests
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Time-bounded privilege elevation requests across {activeWorkspace?.name || 'this workspace'}
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
          <JitRequestTable
            requests={filteredRequests}
            currentUserId={currentUserId}
            canApprove={canApprove}
            canApproveAll={canApproveAll}
            isTeamAdmin={isTeamAdmin}
            isSuperAdmin={isSuperAdmin}
            onApprove={handleApprove}
            onReject={(req) => setConfirmRejectReq(req)}
            onRevoke={(req) => setConfirmRevokeReq(req)}
            onStartEdit={handleStartEditRequest}
            onWithdraw={(req) => setConfirmWithdrawReq(req)}
          />
        )}
      </div>

      {/* New Request Modal */}
      <CreateJitModal
        isOpen={isModalOpen}
        permissionsCatalog={permissionsCatalog}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        ticketId={ticketId}
        setTicketId={setTicketId}
        duration={duration}
        setDuration={setDuration}
        justification={justification}
        setJustification={setJustification}
        submitting={submitting}
        isTeamAdmin={isTeamAdmin}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRequest}
      />

      {/* Revoke Lease Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmRevokeReq)}
        title="Revoke Active JIT Lease?"
        description={`Are you sure you want to terminate the active lease for ${confirmRevokeReq?.requesterName} (${confirmRevokeReq?.requestedRoleLabel})? Elevated privileges will be invalidated immediately.`}
        confirmText="Yes, Revoke Lease"
        cancelText="Keep Active"
        confirmVariant="danger"
        icon="block"
        onConfirm={handleConfirmRevoke}
        onClose={() => setConfirmRevokeReq(null)}
      >
        {confirmRevokeReq && (
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-border-subtle flex items-center justify-between text-[11px] text-on-surface-variant mt-2">
            <span>
              Ticket: <span className="font-mono font-bold text-on-surface">{confirmRevokeReq.ticketId}</span>
            </span>
            <span>
              Remaining: <span className="font-semibold text-error">{confirmRevokeReq.expiresAt}</span>
            </span>
          </div>
        )}
      </ConfirmModal>

      {/* Reject Request Modal with Reason */}
      <ConfirmModal
        isOpen={Boolean(confirmRejectReq)}
        title="Reject Access Request"
        description={`Provide a brief rejection rationale for ${confirmRejectReq?.memberName}:`}
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
        description={`Are you sure you want to cancel and withdraw your pending JIT request for ${confirmWithdrawReq?.requestedRoleLabel} (Ticket #${confirmWithdrawReq?.ticketId})?`}
        confirmText="Yes, Withdraw Request"
        cancelText="Keep Request"
        confirmVariant="danger"
        icon="cancel_schedule_send"
        onConfirm={handleConfirmWithdraw}
        onClose={() => setConfirmWithdrawReq(null)}
      />

      {/* Edit Pending Request Modal */}
      <EditJitModal
        editingRequest={editingRequest}
        editTicketId={editTicketId}
        setEditTicketId={setEditTicketId}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        editJustification={editJustification}
        setEditJustification={setEditJustification}
        onClose={() => setEditingRequest(null)}
        onSave={handleSaveEditRequest}
      />
    </div>
  );
}
