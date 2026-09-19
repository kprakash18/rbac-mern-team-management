function TabButton({ active, children, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
        active ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {icon && <span className="material-symbols-outlined text-[15px]">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

function OnboardingToolbar({
  activeCount,
  assignedCount,
  availableCount,
  filterTab,
  searchQuery,
  setFilterTab,
  setSearchQuery,
}) {
  return (
    <div className="p-md bg-surface-container-lowest border-b border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md shrink-0">
      <div className="inline-flex rounded-lg bg-surface-container p-1 border border-border-subtle w-full sm:w-auto">
        <TabButton active={filterTab === 'available'} icon="person_add" onClick={() => setFilterTab('available')}>
          Available to Board ({availableCount})
        </TabButton>
        <TabButton active={filterTab === 'assigned'} icon="check_circle" onClick={() => setFilterTab('assigned')}>
          Already Assigned ({assignedCount})
        </TabButton>
        <TabButton active={filterTab === 'all'} onClick={() => setFilterTab('all')}>
          All Active ({activeCount})
        </TabButton>
      </div>

      <div className="relative flex-1 max-w-xs w-full">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
        <input
          type="text"
          placeholder="Search active users..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs text-[13px]"
        />
      </div>
    </div>
  );
}

export default OnboardingToolbar;
