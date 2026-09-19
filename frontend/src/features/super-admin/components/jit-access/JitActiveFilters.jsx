function JitActiveFilters({
  filterPermission,
  filterWorkspace,
  hasActiveFilter,
  onReset,
}) {
  if (!hasActiveFilter) return null;

  return (
    <div className="flex items-center gap-xs px-sm py-1 bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant">
      <span>Active Filters:</span>
      {filterWorkspace !== 'ALL' && (
        <span className="font-semibold text-primary bg-card-bg px-2 py-0.5 rounded border border-border-subtle">
          Workspace: {filterWorkspace}
        </span>
      )}
      {filterPermission !== 'ALL' && (
        <span className="font-semibold text-primary bg-card-bg px-2 py-0.5 rounded border border-border-subtle">
          Permission: {filterPermission}
        </span>
      )}
      <button
        type="button"
        onClick={onReset}
        className="ml-auto text-[11px] text-error hover:underline cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  );
}

export default JitActiveFilters;
