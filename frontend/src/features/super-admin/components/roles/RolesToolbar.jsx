const ROLE_FILTERS = ['All', 'System', 'Custom', 'Active', 'Disabled', 'Archived'];

export default function RolesToolbar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="filter-toolbar">
      <div className="flex items-center gap-sm flex-1">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search roles by name, permission key, or scope..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-outline hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="hidden sm:flex tab-group">
          {ROLE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
              className={`tab-item ${
                activeFilter === filter ? 'tab-item-active' : 'tab-item-inactive'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-xs justify-end">
        <div className="view-toggle">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`view-toggle-btn ${
              viewMode === 'grid' ? 'view-toggle-active' : 'view-toggle-inactive'
            }`}
            title="Card Grid View"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`view-toggle-btn ${
              viewMode === 'table' ? 'view-toggle-active' : 'view-toggle-inactive'
            }`}
            title="Table View"
          >
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
          </button>
        </div>
      </div>
    </div>
  );
}
