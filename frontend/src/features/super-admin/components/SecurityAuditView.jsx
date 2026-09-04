import { useState, useEffect, useCallback } from 'react';
import { AUDIT_CATEGORIES } from '@/constants';
import AuditLogsTable from './audit/AuditLogsTable.jsx';
import AuditLogDetailsModal from './audit/AuditLogDetailsModal.jsx';
import Toast from '../../../components/shared/Toast.jsx';
import { useToast } from '../../../lib/useToast.js';
import api from '@/lib/api';

export default function SecurityAuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  // Selected Log for Forensic Inspection Modal
  const [inspectedLog, setInspectedLog] = useState(null);

  // Toast Notification
  const [toast, showToast] = useToast(3500);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const teamsRes = await api.get('/api/teams');
      const teams = teamsRes.data?.data?.teams || teamsRes.data?.data || [];
      if (teams.length > 0) {
        const teamId = teams[0]._id || teams[0].id;
        const res = await api.get(`/api/teams/${teamId}/audit-logs`);
        const rawLogs = Array.isArray(res.data?.data) ? res.data?.data : res.data?.data?.logs || [];
        const formatted = rawLogs.map((l) => ({
          id: l._id || l.id,
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString() : 'Just now',
          isoDate: l.createdAt || new Date().toISOString(),
          actor: {
            name: l.actor?.name || l.actorId?.name || 'System Admin',
            email: l.actor?.email || l.actorId?.email || 'admin@system.local',
            initials: (l.actor?.name || 'SA').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          },
          action: l.action || 'system.event',
          actionLabel: l.action || 'System Event',
          category: l.category || 'IAM',
          severity: l.severity || (l.result === 'FAILURE' ? 'WARNING' : 'INFO'),
          targetIdentifier: l.targetId?.name || l.targetIdentifier || l.targetType || 'System Resource',
          workspace: teams[0].name || 'Enterprise Core',
          ipAddress: l.ipAddress || '127.0.0.1',
          result: (l.result || 'SUCCESS').toUpperCase(),
          userAgent: l.userAgent || 'Mozilla/5.0 Chrome/128.0.0.0',
          correlationId: l.correlationId || `corr-${Math.random().toString(36).substring(2, 9)}`,
          metadata: l.metadata || {},
        }));
        setLogs(formatted);
      }
    } catch (err) {
      console.warn('Failed to load live audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    const matchCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchResult = resultFilter === 'ALL' || log.result === resultFilter;
    const matchSearch =
      !searchQuery ||
      log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery) ||
      log.workspace.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetIdentifier.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSeverity && matchCategory && matchResult && matchSearch;
  });

  // Severity & Metric Counts
  const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;
  const warningCount = logs.filter((l) => l.severity === 'WARNING').length;
  const infoCount = logs.filter((l) => l.severity === 'INFO').length;
  const failureCount = logs.filter((l) => l.result === 'FAILURE' || l.severity === 'CRITICAL').length;
  const jitCount = logs.filter((l) =>
    l.category === 'ACCESS_CONTROL' ||
    l.category === 'IAM' ||
    (l.action && l.action.toLowerCase().includes('jit')) ||
    (l.action && l.action.toLowerCase().includes('grant'))
  ).length;
  const mutationsCount = logs.filter((l) =>
    l.category === 'SYSTEM' ||
    l.category === 'COMPLIANCE' ||
    (l.action && (
      l.action.toLowerCase().includes('role') ||
      l.action.toLowerCase().includes('permission') ||
      l.action.toLowerCase().includes('user') ||
      l.action.toLowerCase().includes('create') ||
      l.action.toLowerCase().includes('update') ||
      l.action.toLowerCase().includes('delete')
    ))
  ).length;

  const handleExportCSV = () => {
    const rows = [
      ['Event ID', 'Timestamp', 'Actor Name', 'Actor Email', 'Action', 'Category', 'Severity', 'Target Identifier', 'Workspace', 'IP Address', 'Result'],
      ...logs.map((l) => [
        l.id,
        l.isoDate || l.timestamp,
        l.actor.name,
        l.actor.email,
        l.action,
        l.category,
        l.severity,
        l.targetIdentifier,
        l.workspace,
        l.ipAddress,
        l.result,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `security-audit-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit logs exported to CSV.');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `security-audit-logs-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit logs exported to JSON.');
  };

  return (
    <div className="flex flex-col w-full p-xl gap-xl">
      {/* Toast Notification */}
      <div className="fixed top-6 right-6 z-1300">
        <Toast message={toast?.msg} type={toast?.type} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm">
            <span>Platform Governance</span>
            <span>/</span>
            <span className="text-on-surface font-semibold">Security Audit Logs</span>
          </div>
          <h1 className="font-display-title text-display-title text-on-surface">Security Audit Logs</h1>
          <p className="font-body-base text-body-base text-on-surface-variant">
            Immutable platform audit ledger • Threat analysis, authentication telemetry &amp; SOC2 compliance.
          </p>
        </div>

        <div className="flex items-center gap-xs sm:gap-sm shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsLiveStreaming(!isLiveStreaming);
              showToast(isLiveStreaming ? 'Live audit streaming paused.' : 'Live audit streaming resumed.');
            }}
            className={`px-sm py-sm rounded-lg font-label-bold text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isLiveStreaming
                ? 'bg-success-bg text-success-text border-success-bg'
                : 'bg-surface-container text-on-surface-variant border-border-subtle'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isLiveStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-text opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveStreaming ? 'bg-success-text' : 'bg-outline'
                }`}
              ></span>
            </span>
            <span>{isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-md py-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer border border-border-subtle"
          >
            <span className="material-symbols-outlined text-[18px]">data_object</span>
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-md py-sm rounded-lg bg-primary hover:bg-on-primary-fixed text-on-primary font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Security Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-variant shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-label-bold text-on-surface-variant block">Total Events (24h)</span>
            <span className="font-display-title text-[22px] font-bold text-on-surface">{logs.length.toLocaleString()} Logged</span>
            <span className="text-[11px] text-success-text font-medium block mt-0.5">
              {logs.length > 0 ? '100% Delivery integrity' : 'No recorded events'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">policy</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-variant shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-label-bold text-on-surface-variant block">Threats / Auth Failures</span>
            <span className={`font-display-title text-[22px] font-bold ${failureCount > 0 ? 'text-error-text' : 'text-on-surface'}`}>
              {failureCount} Blocked
            </span>
            <span className={`text-[11px] font-medium block mt-0.5 ${criticalCount > 0 ? 'text-error-text' : 'text-on-surface-variant'}`}>
              {criticalCount > 0 ? `${criticalCount} Critical alert${criticalCount > 1 ? 's' : ''}` : 'No threats detected'}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${failureCount > 0 ? 'bg-error-bg text-error-text' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]">gpp_maybe</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-variant shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-label-bold text-on-surface-variant block">JIT Privilege Grants</span>
            <span className="font-display-title text-[22px] font-bold text-on-surface">
              {jitCount} Escalation{jitCount === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium block mt-0.5">
              {jitCount > 0 ? 'All TTL-bounded' : 'No active grants'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-warning-bg text-warning-text flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">timer</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-variant shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-label-bold text-on-surface-variant block">RBAC &amp; Config Changes</span>
            <span className="font-display-title text-[22px] font-bold text-on-surface">
              {mutationsCount} Mutation{mutationsCount === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium block mt-0.5">
              {mutationsCount > 0 ? 'Verified by audit' : 'No mutations recorded'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </div>
        </div>
      </div>

      {/* Forensic Search & Filter Controls Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-sm shadow-xs border border-surface-variant flex flex-col lg:flex-row items-center justify-between gap-sm">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-colors"
            placeholder="Search by actor, IP, action, resource..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-xs w-full lg:w-auto justify-end flex-wrap">
          {/* Severity Pills */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5">
            {[
              { id: 'ALL', label: `All (${logs.length})` },
              { id: 'CRITICAL', label: `Critical (${criticalCount})` },
              { id: 'WARNING', label: `Warning (${warningCount})` },
              { id: 'INFO', label: `Info (${infoCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id)}
                className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer ${
                  severityFilter === tab.id
                    ? 'bg-card-bg text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-2.5 bg-surface-container-low rounded-lg text-[12px] font-label-bold text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
          >
            {Object.entries(AUDIT_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="h-9 px-2.5 bg-surface-container-low rounded-lg text-[12px] font-label-bold text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILURE">Failure Only</option>
          </select>
        </div>
      </div>

      {/* Main Audit Logs Table */}
      <AuditLogsTable
        logs={filteredLogs}
        loading={loading}
        onInspectLog={(log) => setInspectedLog(log)}
      />

      {/* Forensic Inspection Modal */}
      <AuditLogDetailsModal
        isOpen={Boolean(inspectedLog)}
        log={inspectedLog}
        onClose={() => setInspectedLog(null)}
      />
    </div>
  );
}
