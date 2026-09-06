import { useState, useEffect } from 'react';
import { useApp } from '@/context/useApp';
import {
  Button,
  Tabs,
  LoadingState,
  ConfirmModal,
  Toast,
  SearchInput,
  EmptyState,
} from '@/shared/components';
import { useJitRequests } from './hooks/useJitRequests';
import * as jitApi from './api/jitApi';
import JitRequestRow from './components/JitRequestRow';
import NewRequestModal from './components/NewRequestModal';
import EditRequestModal from './components/EditRequestModal';
import { JIT_STATUS_TABS } from './constants/jitConstants';

export default function JitRequestView({ currentUser, workspace }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  const canApproveAll = isSuperAdmin;

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const {
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
  } = useJitRequests({ teamId, currentUserId, showToast });

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

  useEffect(() => {
    if (permissionsCatalog.length > 0 && !selectedRole) {
      setSelectedRole(permissionsCatalog[0]._id || permissionsCatalog[0].key);
    }
  }, [permissionsCatalog, selectedRole]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!ticketId.trim() || !justification.trim() || !teamId || submitting) return;

    setSubmitting(true);
    try {
      const selectedPerm = permissionsCatalog.find(
        (p) => p._id === selectedRole || p.key === selectedRole
      );

      const durationMap = {
        '30m': 0.5,
        '1h': 1,
        '2h': 2,
        '4h': 4,
        '8h': 8,
      };

      const durationHours = durationMap[duration] || 2;

      await jitApi.createAccessRequest(teamId, {
        permissionKey: selectedPerm?.key || selectedRole,
        permissionId: selectedPerm?._id || undefined,
        reason: justification.trim(),
        ticketId: ticketId.trim(),
        durationHours,
      });

      setIsModalOpen(false);
      setTicketId('');
      setJustification('');
      setDuration('2h');
      showToast('Access request submitted for authorization review.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to submit access request:', err);
      showToast(
        err.response?.data?.message || err.response?.data?.error?.message || 'Failed to submit access request.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditRequest = (req) => {
    setEditingRequest(req);
    setEditTicketId(req.ticketId || '');
    setEditJustification(req.justification || '');
    const durationStr = req.durationHours ? `${req.durationHours}h` : '2h';
    setEditDuration(['30m', '1h', '2h', '4h', '8h'].includes(durationStr) ? durationStr : '2h');
  };

  const handleSaveEditRequest = async (e) => {
    e.preventDefault();
    if (!editingRequest || !teamId) return;

    const durationMap = { '30m': 0.5, '1h': 1, '2h': 2, '4h': 4, '8h': 8 };
    const durationHours = durationMap[editDuration] || 2;

    try {
      await jitApi.updateAccessRequest(teamId, editingRequest.id, {
        reason: editJustification.trim(),
        ticketId: editTicketId.trim(),
        durationHours,
      });

      setEditingRequest(null);
      showToast('Access request updated successfully.');
      fetchRequestsAndCatalog();
    } catch (err) {
      console.error('Failed to update access request:', err);
      showToast(
        err.response?.data?.message || err.response?.data?.error?.message || 'Failed to update access request.',
        'error'
      );
    }
  };

  const handleConfirmReject = async () => {
    if (!confirmRejectReq) return;
    await rejectRequest(confirmRejectReq.id, rejectReason);
    setConfirmRejectReq(null);
  };

  const handleConfirmRevoke = async () => {
    if (!confirmRevokeReq) return;
    await revokeRequest(confirmRevokeReq.id);
    setConfirmRevokeReq(null);
  };

  const handleConfirmWithdraw = async () => {
    if (!confirmWithdrawReq) return;
    await withdrawRequest(confirmWithdrawReq.id);
    setConfirmWithdrawReq(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-200">
          <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            Just-in-Time (JIT) Privileges
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Request and audit temporary elevated roles and emergency permissions with automatic expiration.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon="lock_open"
          onClick={() => setIsModalOpen(true)}
          className="self-start md:self-auto"
        >
          + Request Access
        </Button>
      </div>

      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search member, role, ticket, or justification..."
            className="flex-1 max-w-md"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tabs
            options={[
              { key: 'ALL', label: 'All Requests' },
              { key: 'ME', label: 'My Requests' },
            ]}
            value={requesterFilter}
            onChange={setRequesterFilter}
          />

          <Tabs
            options={JIT_STATUS_TABS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Loading access requests..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-220">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-container-low text-[12px] font-semibold text-on-surface-variant">
                    <th className="py-3 px-4 w-44">Requester</th>
                    <th className="py-3 px-4 w-52">Requested Privilege</th>
                    <th className="py-3 px-4">Context &amp; Justification</th>
                    <th className="py-3 px-4 w-32">Duration</th>
                    <th className="py-3 px-4 w-36 text-center">Status</th>
                    <th className="py-3 px-4 w-40 text-right">Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-body-sm">
                  {filteredRequests.map((req) => (
                    <JitRequestRow
                      key={req.id}
                      req={req}
                      currentUserId={currentUserId}
                      isTeamAdmin={isTeamAdmin}
                      isSuperAdmin={isSuperAdmin}
                      canApproveAll={canApproveAll}
                      onEdit={handleStartEditRequest}
                      onWithdraw={setConfirmWithdrawReq}
                      onApprove={(id) => approveRequest(id, currentUser?.name)}
                      onReject={setConfirmRejectReq}
                      onRevoke={setConfirmRevokeReq}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <EmptyState
                icon="shield_person"
                title="No JIT requests found"
                message="Elevate privileges just-in-time when you need them for sprint tasks or production maintenance."
              />
            )}
          </>
        )}
      </div>

      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
        onSubmit={handleSubmitRequest}
        isTeamAdmin={isTeamAdmin}
      />

      <EditRequestModal
        editingRequest={editingRequest}
        onClose={() => setEditingRequest(null)}
        editTicketId={editTicketId}
        setEditTicketId={setEditTicketId}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        editJustification={editJustification}
        setEditJustification={setEditJustification}
        onSubmit={handleSaveEditRequest}
      />

      <ConfirmModal
        isOpen={Boolean(confirmRevokeReq)}
        title="Revoke Active JIT Lease?"
        description={`Are you sure you want to terminate the active lease for ${confirmRevokeReq?.memberName || 'member'} (${confirmRevokeReq?.requestedRoleLabel})? Elevated privileges will be invalidated immediately.`}
        confirmText="Yes, Revoke Lease"
        cancelText="Keep Active"
        confirmVariant="danger"
        icon="block"
        onConfirm={handleConfirmRevoke}
        onClose={() => setConfirmRevokeReq(null)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmRejectReq)}
        title="Reject JIT Access Request"
        description={`Reject request from ${confirmRejectReq?.memberName || 'member'} for ${confirmRejectReq?.requestedRoleLabel}?`}
        confirmText="Confirm Rejection"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="cancel"
        onConfirm={handleConfirmReject}
        onClose={() => setConfirmRejectReq(null)}
      >
        <div className="mt-3">
          <label className="text-label-sm font-label-bold text-on-surface block mb-1">
            Rejection Reason (Visible to requester)
          </label>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
            placeholder="Explain why this request is being denied..."
          />
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={Boolean(confirmWithdrawReq)}
        title="Withdraw Access Request?"
        description={`Are you sure you want to withdraw request ${confirmWithdrawReq?.ticketId}? This action cannot be undone.`}
        confirmText="Withdraw Request"
        cancelText="Keep Pending"
        confirmVariant="danger"
        icon="delete"
        onConfirm={handleConfirmWithdraw}
        onClose={() => setConfirmWithdrawReq(null)}
      />
    </div>
  );
}
