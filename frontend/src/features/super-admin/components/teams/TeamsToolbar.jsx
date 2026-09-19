export default function TeamsToolbar({
  searchQuery,
  onSearchChange,
  filterTabs,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onCreateTeam,
}) {
  return (
    <div className="filter-toolbar">
      <div className="relative w-full sm:w-80">
        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-lg pl-10 pr-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          placeholder="Search teams by name or description..."
          type="text"
        />
      </div>

      <div className="flex items-center gap-xs flex-wrap">
        <div className="tab-group">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onFilterChange(tab)}
              className={`tab-item ${activeFilter === tab ? 'tab-item-active' : 'tab-item-inactive'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="view-toggle ml-xs">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`view-toggle-btn ${viewMode === 'table' ? 'view-toggle-active' : 'view-toggle-inactive'}`}
            title="Table View"
          >
            <span className="material-symbols-outlined text-[18px]">view_list</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`view-toggle-btn ${viewMode === 'grid' ? 'view-toggle-active' : 'view-toggle-inactive'}`}
            title="Grid Cards View"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
        </div>

        <button
          onClick={onCreateTeam}
          className="ml-md px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors flex items-center gap-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          &nbsp;Create Team
        </button>
      </div>
    </div>
  );
}
