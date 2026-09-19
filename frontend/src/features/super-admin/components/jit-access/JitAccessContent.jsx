import ActiveGrantsTable from '../jit/ActiveGrantsTable.jsx';
import PendingRequestsTable from '../jit/PendingRequestsTable.jsx';
import JitHistoryTable from '../jit/JitHistoryTable.jsx';

function LoadingJitAccess() {
  return (
    <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
      <span className="text-body-sm">Loading JIT elevation requests...</span>
    </div>
  );
}

function JitAccessContent({
  activeTab,
  grants,
  history,
  loading,
  requests,
  onApproveRequest,
  onOpenRejectModal,
  onRevokeGrant,
  onSelectRequest,
}) {
  if (loading) return <LoadingJitAccess />;

  if (activeTab === 'pending') {
    return (
      <PendingRequestsTable
        requests={requests}
        onSelectRequest={onSelectRequest}
        onApproveRequest={onApproveRequest}
        onOpenRejectModal={onOpenRejectModal}
      />
    );
  }

  if (activeTab === 'active') {
    return <ActiveGrantsTable grants={grants} onRevokeGrant={onRevokeGrant} />;
  }

  return <JitHistoryTable history={history} />;
}

export default JitAccessContent;
