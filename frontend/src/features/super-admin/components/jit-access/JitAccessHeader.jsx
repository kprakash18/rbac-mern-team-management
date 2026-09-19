function JitAccessHeader({ hasActiveFilter, onFilter, onNewGrant }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
      <div className="flex flex-col gap-base">
        <h1 className="font-display-title text-display-title text-on-surface">JIT Access Governance</h1>
        <p className="font-body-base text-body-base text-on-surface-variant">
          Inspect, approve, and manage Just-In-Time elevation requests from Team Admins across all teams.
        </p>
      </div>
      <div className="flex items-center gap-sm">
        <button
          type="button"
          className={`px-md py-sm rounded-lg font-label-bold text-label-bold flex items-center gap-xs transition-colors cursor-pointer ${
            hasActiveFilter
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
          }`}
          onClick={onFilter}
        >
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          <span>Filter</span>
          {hasActiveFilter && <span className="w-2 h-2 rounded-full bg-warning-text ml-0.5"></span>}
        </button>
        <button
          type="button"
          className="px-md py-sm rounded-lg bg-primary text-on-primary font-label-bold text-label-bold flex items-center gap-xs hover:bg-on-primary-fixed transition-colors cursor-pointer shadow-xs"
          onClick={onNewGrant}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Grant
        </button>
      </div>
    </div>
  );
}

export default JitAccessHeader;
