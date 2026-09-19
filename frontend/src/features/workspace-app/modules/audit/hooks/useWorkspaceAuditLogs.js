import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/useApp';
import api from '@/lib/api';
import { useToast } from '@/lib/useToast';
import { normalizeAuditLog } from '../auditModel';

function downloadDataUrl({ dataUrl, filename }) {
  const link = document.createElement('a');
  link.setAttribute('href', dataUrl);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function useWorkspaceAuditLogs({ currentUser, workspace }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const isAuditor = currentUser?.role?.toLowerCase().includes('auditor');
  const hasAccess = isTeamAdmin || isAuditor || (typeof currentUser?.hasPermission === 'function' && currentUser.hasPermission('audit.read'));
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
      setLogs(rawLogs.map(normalizeAuditLog));
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter((event) => {
    const matchCategory = categoryFilter === 'ALL' || event.category === categoryFilter;
    const matchSeverity = severityFilter === 'ALL' || event.severity === severityFilter;
    const query = searchQuery.toLowerCase();
    const matchSearch = !query ||
      event.actor.name.toLowerCase().includes(query) ||
      event.actor.email.toLowerCase().includes(query) ||
      event.actionLabel.toLowerCase().includes(query) ||
      event.resource.toLowerCase().includes(query) ||
      event.details.toLowerCase().includes(query) ||
      event.ipAddress.includes(query);
    return matchCategory && matchSeverity && matchSearch;
  });

  const getFilePrefix = () => `${workspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'workspace'}-audit-${Date.now()}`;

  const handleExportCSV = () => {
    const rows = [
      ['Event ID', 'Timestamp', 'Actor Name', 'Actor Email', 'Action', 'Category', 'Severity', 'Target Resource', 'Details', 'IP Address', 'Status'],
      ...filteredLogs.map((log) => [log.id, log.isoDate || log.timestamp, log.actor.name, log.actor.email, log.action, log.category, log.severity, log.resource, `"${log.details.replace(/"/g, '""')}"`, log.ipAddress, log.status]),
    ];
    downloadDataUrl({ dataUrl: `data:text/csv;charset=utf-8,${rows.map((row) => row.join(',')).join('\n')}`, filename: `${getFilePrefix()}.csv` });
    showToast('Audit trail exported to CSV.');
  };

  const handleExportJSON = () => {
    downloadDataUrl({ dataUrl: `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredLogs, null, 2))}`, filename: `${getFilePrefix()}.json` });
    showToast('Audit trail exported to JSON.');
  };

  return {
    categoryFilter,
    filteredLogs,
    hasAccess,
    loading,
    logs,
    searchQuery,
    selectedEvent,
    severityFilter,
    toast,
    handleExportCSV,
    handleExportJSON,
    setCategoryFilter,
    setSearchQuery,
    setSelectedEvent,
    setSeverityFilter,
  };
}
