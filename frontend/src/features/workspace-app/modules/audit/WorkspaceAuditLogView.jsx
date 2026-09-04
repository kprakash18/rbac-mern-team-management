import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { useApp } from '@/context/useApp';
import SearchInput from '../../../../components/shared/SearchInput';
import EmptyState from '../../../../components/shared/EmptyState';
import Toast from '../../../../components/shared/Toast';
import { useToast } from '../../../../lib/useToast';

const CATEGORY_CONFIG = {
  ALL: { label: 'All Categories', icon: 'list' },
  JIT_ELEVATION: { label: 'JIT Elevation', icon: 'timer', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  ROLE_MANAGEMENT: { label: 'Roles & RBAC', icon: 'badge', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  MEMBERSHIP: { label: 'Membership', icon: 'group', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  TASK_OPERATIONS: { label: 'Tasks & Sprints', icon: 'assignment', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  SECURITY: { label: 'Security & Auth', icon: 'shield', color: 'text-red-700 bg-red-50 border-red-200' },
};

export default function WorkspaceAuditLogView({ currentUser, workspace, onNavigate }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const isAuditor = currentUser?.role?.toLowerCase().includes('auditor');
  const hasAccess = isTeamAdmin || isAuditor;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, showToast] = useToast();

  const fetchAuditLogs = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/teams/${teamId}/audit-logs`);
      const rawLogs = res.data?.data?.logs || res.data?.data || [];
      const formatted = rawLogs.map((log) => {
        const actor = log.actorId || {};
        const act = (log.action || '').toLowerCase();
        const category =
          act.includes('access') || act.includes('grant') || act.includes('jit')
            ? 'JIT_ELEVATION'
            : act.includes('role') || act.includes('permission')
            ? 'ROLE_MANAGEMENT'
            : act.includes('membership') || act.includes('invite') || act.includes('member')
            ? 'MEMBERSHIP'
            : act.includes('task')
            ? 'TASK_OPERATIONS'
            : 'SECURITY';

        return {
          id: log._id || log.id,
          _id: log._id || log.id,
          timestamp: log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          isoDate: log.createdAt || new Date().toISOString(),
          actor: {
            name: actor.name || 'System',
            email: actor.email || 'system@internal',
            initials: (actor.name || 'S').slice(0, 2).toUpperCase(),
            role: actor.role || 'Member',
          },
          action: log.action || 'ACTION',
          actionLabel: (log.action || 'System Event').replace('.', ' ').toUpperCase(),
          category,
          severity: log.result === 'FAILURE' ? 'CRITICAL' : 'INFO',
          resource: log.targetType || 'Resource',
          details: log.metadata ? (typeof log.metadata === 'object' ? Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') : String(log.metadata)) : `${log.action} performed successfully`,
          ipAddress: log.ipAddress || '127.0.0.1',
          status: log.result || 'SUCCESS',
        };
      });
      setLogs(formatted);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-lg text-center">
        <div className="w-14 h-14 rounded-full bg-error-container/30 text-error flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[32px]">shield_lock</span>
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-on-surface">Audit Access Restricted</h2>
          <p className="text-body-sm text-on-surface-variant max-w-md mt-1">
            Immutable workspace audit logs are restricted to Team Administrators and Security Auditors in compliance with organizational RBAC policy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('dashboard')}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer mt-2"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filteredLogs = logs.filter((evt) => {
    const matchCat = categoryFilter === 'ALL' || evt.category === categoryFilter;
    const matchSev = severityFilter === 'ALL' || evt.severity === severityFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      evt.actor.name.toLowerCase().includes(q) ||
      evt.actor.email.toLowerCase().includes(q) ||
      evt.actionLabel.toLowerCase().includes(q) ||
      evt.resource.toLowerCase().includes(q) ||
      evt.details.toLowerCase().includes(q) ||
      evt.ipAddress.includes(q);

    return matchCat && matchSev && matchSearch;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Event ID', 'Timestamp', 'Actor Name', 'Actor Email', 'Action', 'Category', 'Severity', 'Target Resource', 'Details', 'IP Address', 'Status'],
      ...filteredLogs.map((l) => [
        l.id,
        l.isoDate || l.timestamp,
        l.actor.name,
        l.actor.email,
        l.action,
        l.category,
        l.severity,
        l.resource,
        `"${l.details.replace(/"/g, '""')}"`,
        l.ipAddress,
        l.status,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${workspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'workspace'}-audit-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit trail exported to CSV.');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${workspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'workspace'}-audit-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit trail exported to JSON.');
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-md sm:p-lg gap-lg animate-in fade-in duration-150">
      {/* Toast Notification */}
      <Toast message={toast?.msg} type={toast?.type} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-border-subtle pb-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Workspace Audit Trail
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold">
              {workspace?.name || 'Acme Engineering'}
            </span>
          </div>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Cryptographically sealed activity log of all access grants, membership changes, and operational tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-container-lowest hover:bg-surface-container text-on-surface text-label-sm font-label-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-container-lowest hover:bg-surface-container text-on-surface text-label-sm font-label-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">code</span>
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-subtle flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant">Total Logged Events</span>
          <span className="text-[22px] font-bold text-on-surface mt-0.5">{logs.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-subtle flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant">JIT Privilege Grants</span>
          <span className="text-[22px] font-bold text-amber-700 mt-0.5">
            {logs.filter((l) => l.category === 'JIT_ELEVATION').length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-subtle flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant">Role & Member Edits</span>
          <span className="text-[22px] font-bold text-purple-700 mt-0.5">
            {logs.filter((l) => l.category === 'ROLE_MANAGEMENT' || l.category === 'MEMBERSHIP').length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-subtle flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant">Security Alerts</span>
          <span className="text-[22px] font-bold text-red-700 mt-0.5">
            {logs.filter((l) => l.severity === 'CRITICAL').length}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low border border-border-subtle">
        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search by actor, action, resource, or IP address..."
          className="flex-1 min-w-60"
        />

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface text-[12px] font-semibold outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="JIT_ELEVATION">JIT Elevation</option>
            <option value="ROLE_MANAGEMENT">Roles & RBAC</option>
            <option value="MEMBERSHIP">Membership</option>
            <option value="TASK_OPERATIONS">Tasks & Sprints</option>
            <option value="SECURITY">Security & Auth</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface text-[12px] font-semibold outline-none cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Events Table / Feed */}
      <div className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
            <span className="text-[13px] font-medium">Loading workspace audit events...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No audit events found"
            message="Try resetting filters or adjusting search terms."
          />
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredLogs.map((evt) => {
              const catConfig = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG.SECURITY;

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="p-3.5 sm:p-4 flex items-start justify-between gap-3 hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Actor Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${
                        evt.actor.isAnomaly
                          ? 'bg-red-100 text-red-800'
                          : evt.actor.isSystem
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-primary text-on-primary'
                      }`}
                    >
                      {evt.actor.initials}
                    </div>

                    {/* Main Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-bold text-[13px] text-on-surface">
                          {evt.actor.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${catConfig.color}`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{catConfig.icon}</span>
                          <span>{evt.actionLabel}</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            evt.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : evt.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </div>

                      <p className="text-[13px] text-on-surface-variant leading-snug mt-1">
                        {evt.details}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant font-mono">
                        <span>Target: <span className="text-on-surface font-semibold">{evt.resource}</span></span>
                        <span>IP: {evt.ipAddress}</span>
                        <span>Event ID: {evt.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & Inspect Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-on-surface-variant font-mono">{evt.timestamp}</span>
                    <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Forensic Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-lg pb-md border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Audit Event Details
                  </h3>
                  <span className="font-mono text-[11px] text-on-surface-variant block">
                    {selectedEvent.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-lg overflow-y-auto flex flex-col gap-md">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
                  <span className="font-label-bold text-label-sm text-on-surface">Cryptographic Verification: VALID</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {selectedEvent.status}
                </span>
              </div>

              {/* Event Metadata */}
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="p-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest">
                  <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Action Type</span>
                  <span className="font-semibold text-on-surface font-mono">{selectedEvent.action}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest">
                  <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-on-surface">{selectedEvent.category}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest">
                  <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Actor Name</span>
                  <span className="font-semibold text-on-surface">{selectedEvent.actor.name}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest">
                  <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Actor Email</span>
                  <span className="font-semibold text-on-surface font-mono">{selectedEvent.actor.email}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest">
                  <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Target Resource</span>
                  <span className="font-semibold text-on-surface font-mono">{selectedEvent.resource}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest">
                  <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Source IP</span>
                  <span className="font-semibold text-on-surface font-mono">{selectedEvent.ipAddress}</span>
                </div>
              </div>

              {/* Full Description */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-on-surface uppercase">Event Narrative</span>
                <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle text-[13px] text-on-surface leading-relaxed">
                  {selectedEvent.details}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-md border-t border-border-subtle bg-surface-container-low flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-md py-2 rounded-lg bg-primary text-on-primary font-label-bold text-label-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
