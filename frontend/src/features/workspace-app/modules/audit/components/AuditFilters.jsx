import { SearchInput } from '@/shared/components';

function AuditFilters({
  categoryFilter,
  searchQuery,
  severityFilter,
  setCategoryFilter,
  setSearchQuery,
  setSeverityFilter,
}) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low border border-border-subtle">
      <SearchInput
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder="Search by actor, action, resource, or IP address..."
        className="flex-1 min-w-60"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-9 px-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface text-[12px] font-semibold outline-none cursor-pointer">
          <option value="ALL">All Categories</option>
          <option value="JIT_ELEVATION">JIT Elevation</option>
          <option value="ROLE_MANAGEMENT">Roles & RBAC</option>
          <option value="MEMBERSHIP">Membership</option>
          <option value="TASK_OPERATIONS">Tasks & Sprints</option>
          <option value="SECURITY">Security & Auth</option>
        </select>
        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="h-9 px-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface text-[12px] font-semibold outline-none cursor-pointer">
          <option value="ALL">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>
    </div>
  );
}

export default AuditFilters;
