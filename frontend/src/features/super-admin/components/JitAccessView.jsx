import JitFilterModal from './jit/JitFilterModal.jsx';
import NewGrantModal from './jit/NewGrantModal.jsx';
import RequestDetailsModal from './jit/RequestDetailsModal.jsx';
import JitAccessContent from './jit-access/JitAccessContent.jsx';
import JitAccessHeader from './jit-access/JitAccessHeader.jsx';
import JitAccessTabs from './jit-access/JitAccessTabs.jsx';
import JitActiveFilters from './jit-access/JitActiveFilters.jsx';
import JitRejectDialog from './jit-access/JitRejectDialog.jsx';
import { useJitAccessGovernance } from './jit-access/useJitAccessGovernance.js';
import { Toast } from '@/shared/components';

export default function JitAccessView() {
  const jit = useJitAccessGovernance();

  const handleRejectConfirm = (requestId, reason) => {
    jit.handleConfirmReject(requestId, reason);
    jit.setRejectingRequest(null);
  };

  return (
    <div className="flex flex-col w-full p-xl gap-xl">
      <div className="fixed top-6 right-6 z-1200">
        <Toast message={jit.toast?.msg} type={jit.toast?.type} />
      </div>

      <JitAccessHeader
        hasActiveFilter={jit.hasActiveFilter}
        onFilter={() => jit.setIsFilterModalOpen(true)}
        onNewGrant={() => jit.setIsNewGrantOpen(true)}
      />

      <JitAccessTabs
        activeTab={jit.activeTab}
        counts={{
          active: jit.filteredGrants.length,
          history: jit.filteredHistory.length,
          pending: jit.filteredRequests.length,
        }}
        onTabChange={jit.setActiveTab}
      />

      <JitActiveFilters
        filterPermission={jit.filterPermission}
        filterWorkspace={jit.filterWorkspace}
        hasActiveFilter={jit.hasActiveFilter}
        onReset={jit.handleResetFilters}
      />

      <JitAccessContent
        activeTab={jit.activeTab}
        grants={jit.filteredGrants}
        history={jit.filteredHistory}
        loading={jit.loading}
        requests={jit.filteredRequests}
        onApproveRequest={jit.handleApproveRequest}
        onOpenRejectModal={jit.setRejectingRequest}
        onRevokeGrant={jit.handleRevokeGrant}
        onSelectRequest={jit.setSelectedRequestDetails}
      />

      <RequestDetailsModal
        request={jit.selectedRequestDetails}
        onClose={() => jit.setSelectedRequestDetails(null)}
        onApprove={jit.handleApproveRequest}
        onOpenReject={jit.setRejectingRequest}
      />

      <NewGrantModal
        isOpen={jit.isNewGrantOpen}
        onClose={() => jit.setIsNewGrantOpen(false)}
        onSubmit={jit.handleCreateGrant}
      />

      <JitRejectDialog
        reason={jit.rejectReason}
        request={jit.rejectingRequest}
        onClose={() => jit.setRejectingRequest(null)}
        onConfirm={handleRejectConfirm}
        onReasonChange={jit.setRejectReason}
      />

      <JitFilterModal
        isOpen={jit.isFilterModalOpen}
        onClose={() => jit.setIsFilterModalOpen(false)}
        filterWorkspace={jit.filterWorkspace}
        setFilterWorkspace={jit.setFilterWorkspace}
        filterPermission={jit.filterPermission}
        setFilterPermission={jit.setFilterPermission}
        onResetFilters={jit.handleResetFilters}
      />
    </div>
  );
}
