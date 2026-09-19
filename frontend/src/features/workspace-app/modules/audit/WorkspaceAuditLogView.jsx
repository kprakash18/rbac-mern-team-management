import { Toast } from '@/shared/components';
import AuditAccessDenied from './components/AuditAccessDenied';
import AuditEventDetailsModal from './components/AuditEventDetailsModal';
import AuditEventsList from './components/AuditEventsList';
import AuditFilters from './components/AuditFilters';
import AuditHeader from './components/AuditHeader';
import AuditStats from './components/AuditStats';
import { useWorkspaceAuditLogs } from './hooks/useWorkspaceAuditLogs';

export default function WorkspaceAuditLogView({ currentUser, workspace, onNavigate }) {
  const audit = useWorkspaceAuditLogs({ currentUser, workspace });

  if (!audit.hasAccess) {
    return <AuditAccessDenied onNavigate={onNavigate} />;
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-md sm:p-lg gap-lg animate-in fade-in duration-150">
      <Toast message={audit.toast?.msg} type={audit.toast?.type} />

      <AuditHeader
        workspace={workspace}
        onExportCSV={audit.handleExportCSV}
        onExportJSON={audit.handleExportJSON}
      />

      <AuditStats logs={audit.logs} />

      <AuditFilters
        categoryFilter={audit.categoryFilter}
        searchQuery={audit.searchQuery}
        severityFilter={audit.severityFilter}
        setCategoryFilter={audit.setCategoryFilter}
        setSearchQuery={audit.setSearchQuery}
        setSeverityFilter={audit.setSeverityFilter}
      />

      <AuditEventsList
        events={audit.filteredLogs}
        loading={audit.loading}
        onSelectEvent={audit.setSelectedEvent}
      />

      <AuditEventDetailsModal
        event={audit.selectedEvent}
        onClose={() => audit.setSelectedEvent(null)}
      />
    </div>
  );
}
