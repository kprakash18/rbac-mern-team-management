import { useState } from 'react';
import { INITIAL_BROADCASTS } from '@/constants';
import BroadcastCard from './broadcasts/BroadcastCard.jsx';
import CreateEditBroadcastModal from './broadcasts/CreateEditBroadcastModal.jsx';
import BroadcastDetailsDrawer from './broadcasts/BroadcastDetailsDrawer.jsx';
import ConfirmModal from '../../../components/shared/ConfirmModal.jsx';

export default function SystemBroadcastsView() {
  const [broadcasts, setBroadcasts] = useState(INITIAL_BROADCASTS);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [broadcastToEdit, setBroadcastToEdit] = useState(null);
  const [inspectingBroadcast, setInspectingBroadcast] = useState(null);
  const [deletingBroadcast, setDeletingBroadcast] = useState(null);
  const [isEndEarlyMode, setIsEndEarlyMode] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered broadcasts
  const filteredBroadcasts = broadcasts.filter((bc) => {
    const matchStatus = statusFilter === 'ALL' || bc.status === statusFilter;
    const matchType = typeFilter === 'ALL' || bc.type === typeFilter;
    const matchSearch =
      !searchQuery ||
      bc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bc.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bc.targetWorkspaces.some((ws) => ws.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchType && matchSearch;
  });

  // Summary counts
  const activeCount = broadcasts.filter((b) => b.status === 'ACTIVE').length;
  const scheduledCount = broadcasts.filter((b) => b.status === 'SCHEDULED').length;
  const endedCount = broadcasts.filter((b) => b.status === 'ENDED').length;

  const handleCreateOrUpdateBroadcast = (newBroadcast) => {
    if (broadcastToEdit) {
      setBroadcasts((prev) => prev.map((b) => (b.id === newBroadcast.id ? newBroadcast : b)));
      showToast(`Broadcast "${newBroadcast.title}" was updated.`);
    } else {
      setBroadcasts((prev) => [newBroadcast, ...prev]);
      showToast(`Broadcast "${newBroadcast.title}" published.`);
    }
    setBroadcastToEdit(null);
  };

  const handleEndEarly = (bc) => {
    setDeletingBroadcast(bc);
    setIsEndEarlyMode(true);
  };

  const handleDelete = (bc) => {
    setDeletingBroadcast(bc);
    setIsEndEarlyMode(false);
  };

  const handleConfirmEndEarlyOrDelete = (id) => {
    if (isEndEarlyMode) {
      setBroadcasts((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: 'ENDED', timeLabel: 'Ended early by admin', stickyNotice: 'Ended early' }
            : b
        )
      );
      showToast('Broadcast was deactivated.');
    } else {
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      showToast('Broadcast record removed.');
    }
    setDeletingBroadcast(null);
  };

  const handleExportAllAuditLogs = () => {
    const rows = [
      ['Broadcast ID', 'Title', 'Type', 'Status', 'Scope', 'Targeted Users', 'Viewed', 'Acknowledged', 'Created By', 'Created At'],
      ...broadcasts.map((b) => [
        b.id,
        b.title,
        b.type,
        b.status,
        b.scope,
        b.metrics?.targetedUsers || 0,
        b.metrics?.viewedCount || 0,
        b.metrics?.acknowledgedCount || 0,
        b.createdBy,
        b.createdAt,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system-broadcasts-audit-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Broadcast audit log downloaded.');
  };

  return (
    <div className="flex flex-col w-full p-xl gap-xl max-w-5xl mx-auto">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[1300] bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-xl shadow-2xl flex items-center gap-sm animate-in slide-in-from-top-4 duration-200 border border-inverse-on-surface/20">
          <span className="material-symbols-outlined text-[20px] text-primary">info</span>
          <span className="font-label-bold text-label-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-title text-display-title text-on-surface">System Broadcasts</h1>
          <p className="font-body-base text-body-base text-on-surface-variant">
            Send platform-wide announcements, maintenance notices, and emergency alerts.
          </p>
        </div>
        <div className="flex items-center gap-xs sm:gap-sm shrink-0">
          <button
            type="button"
            onClick={handleExportAllAuditLogs}
            className="px-md py-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer border border-border-subtle"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setBroadcastToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="px-md py-sm rounded-lg bg-primary hover:bg-on-primary-fixed text-on-primary font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Broadcast</span>
          </button>
        </div>
      </div>

      {/* Simple Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-variant shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-label-bold text-on-surface-variant block">Active Alerts</span>
            <span className="font-display-title text-[22px] font-bold text-on-surface">{activeCount} Live</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-error-bg text-error-text flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">campaign</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-variant shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-label-bold text-on-surface-variant block">Scheduled Alerts</span>
            <span className="font-display-title text-[22px] font-bold text-on-surface">{scheduledCount} Upcoming</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-warning-bg text-warning-text flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-variant shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-label-bold text-on-surface-variant block">Average Fleet Reach</span>
            <span className="font-display-title text-[22px] font-bold text-success-text">94.2%</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-success-bg text-success-text flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </div>
        </div>
      </div>

      {/* Single-Line Controls Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-sm shadow-xs border border-surface-variant flex flex-col sm:flex-row items-center justify-between gap-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-colors"
            placeholder="Search broadcasts by title or keyword..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-xs w-full sm:w-auto justify-end flex-wrap">
          {/* Status Pills */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5">
            {[
              { id: 'ALL', label: `All (${broadcasts.length})` },
              { id: 'ACTIVE', label: `Active (${activeCount})` },
              { id: 'SCHEDULED', label: `Scheduled (${scheduledCount})` },
              { id: 'ENDED', label: `Ended (${endedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-card-bg text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-2.5 bg-surface-container-low rounded-lg text-[12px] font-label-bold text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="OUTAGE">Critical Outage</option>
            <option value="MAINTENANCE">Scheduled Maintenance</option>
            <option value="POLICY">Policy &amp; Compliance</option>
            <option value="ANNOUNCEMENT">Announcement</option>
          </select>
        </div>
      </div>

      {/* Broadcasts List */}
      <div className="flex flex-col gap-md">
        {filteredBroadcasts.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-2xl text-center border border-dashed border-border-subtle">
            <span className="material-symbols-outlined text-[42px] text-outline mb-xs">campaign</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">No broadcasts found</h3>
            <p className="font-body-md text-body-sm text-on-surface-variant mt-xs">
              Try resetting your search query or switching the category filter back to "All".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="mt-sm px-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredBroadcasts.map((bc) => (
            <BroadcastCard
              key={bc.id}
              broadcast={bc}
              onOpenDetails={setInspectingBroadcast}
              onEdit={(editing) => {
                setBroadcastToEdit(editing);
                setIsCreateModalOpen(true);
              }}
              onEndEarly={handleEndEarly}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Create / Edit Broadcast Modal */}
      <CreateEditBroadcastModal
        isOpen={isCreateModalOpen}
        broadcastToEdit={broadcastToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBroadcastToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateBroadcast}
      />

      {/* Broadcast Details & Analytics Drawer */}
      <BroadcastDetailsDrawer
        isOpen={Boolean(inspectingBroadcast)}
        broadcast={inspectingBroadcast}
        onClose={() => setInspectingBroadcast(null)}
        onEndEarly={handleEndEarly}
        onExtend={() => showToast('Broadcast end time extended by 24 hours.')}
      />

      {/* Delete / End Early Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingBroadcast)}
        title={isEndEarlyMode ? 'End Broadcast Early?' : 'Delete Broadcast?'}
        confirmText={isEndEarlyMode ? 'Confirm End Early' : 'Confirm Delete'}
        confirmVariant="danger"
        icon={isEndEarlyMode ? 'stop_circle' : 'delete_forever'}
        onClose={() => setDeletingBroadcast(null)}
        onConfirm={() => {
          if (deletingBroadcast) {
            handleConfirmEndEarlyOrDelete(deletingBroadcast.id);
            setDeletingBroadcast(null);
          }
        }}
      >
        {deletingBroadcast && (
          <div className="space-y-3 text-[13px] text-on-surface">
            <p>
              Are you sure you want to {isEndEarlyMode ? 'end the broadcast early for' : 'permanently delete'}{' '}
              <strong>"{deletingBroadcast.title}"</strong>?
            </p>
            <div className="p-2.5 bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant space-y-1">
              <div><strong>Type:</strong> {deletingBroadcast.type}</div>
              <div><strong>Target Scope:</strong> {deletingBroadcast.scope}</div>
              <div><strong>Active Reach:</strong> {deletingBroadcast.metrics?.targetedUsers} targeted users</div>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
