export default function TeamRolesToolbar({
  viewMode,
  onViewModeChange,
  roleCount,
  memberCount,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="p-md bg-surface-container-lowest border-b border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md shrink-0">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="inline-flex rounded-lg bg-surface-container p-1 border border-border-subtle">
          <button
            type="button"
            onClick={() => onViewModeChange('roles')}
            className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'roles'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">badge</span>
            <span>By Roles ({roleCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('members')}
            className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'members'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">group</span>
            <span>By Members ({memberCount})</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 max-w-md w-full">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
        <input
          type="text"
          placeholder={viewMode === 'roles' ? 'Search team roles or assigned members...' : 'Search members or roles...'}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs text-[13px]"
        />
      </div>
    </div>
  );
}
