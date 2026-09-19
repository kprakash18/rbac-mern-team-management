import { SearchInput } from '@/shared/components';

const ROLES_FILTER = ['All Roles', 'Team Admin', 'Developer', 'Viewer', 'Security Auditor'];
const STATUS_TABS = ['All', 'Active', 'Suspended'];

function MemberFilters({
  searchQuery,
  selectedRole,
  statusFilter,
  viewMode,
  onRoleChange,
  onSearchChange,
  onStatusChange,
  onViewModeChange,
}) {
  return (
    <div className="filter-toolbar">
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onClear={() => onSearchChange({ target: { value: '' } })}
          placeholder="Search by name, email, role..."
          className="flex-1 min-w-50 max-w-md"
        />
        <select
          value={selectedRole}
          onChange={onRoleChange}
          className="text-label-sm bg-surface-container-lowest border border-border-subtle rounded-lg px-3 py-1.5 text-on-surface outline-none cursor-pointer focus:ring-2 focus:ring-primary shadow-2xs"
        >
          {ROLES_FILTER.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="tab-group">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onStatusChange(tab)}
              className={`tab-item ${statusFilter === tab ? 'tab-item-active' : 'tab-item-inactive'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="view-toggle">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`view-toggle-btn ${viewMode === 'grid' ? 'view-toggle-active' : 'view-toggle-inactive'}`}
            title="Grid View"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`view-toggle-btn ${viewMode === 'table' ? 'view-toggle-active' : 'view-toggle-inactive'}`}
            title="Table View"
          >
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberFilters;
