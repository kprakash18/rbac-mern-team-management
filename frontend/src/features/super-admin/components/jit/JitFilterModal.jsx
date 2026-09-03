export default function JitFilterModal({
  isOpen,
  onClose,
  filterWorkspace,
  setFilterWorkspace,
  filterPermission,
  setFilterPermission,
  onResetFilters,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-jit-filter">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[420px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-surface-container text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Filter JIT Access</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Slice grants by workspace or permission</p>
            </div>
          </div>
          <button
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-lg space-y-md">
          <div>
            <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
              Filter by Workspace
            </label>
            <select
              value={filterWorkspace}
              onChange={(e) => setFilterWorkspace(e.target.value)}
              className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Workspaces</option>
              <option value="Engineering">Engineering</option>
              <option value="Operations">Operations</option>
              <option value="Security">Security</option>
              <option value="Finance Secure">Finance Secure</option>
              <option value="Marketing Global">Marketing Global</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
              Filter by Permission Key
            </label>
            <select
              value={filterPermission}
              onChange={(e) => setFilterPermission(e.target.value)}
              className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Permissions</option>
              <option value="DB_ADMIN">DB_ADMIN</option>
              <option value="K8S_WRITE">K8S_WRITE</option>
              <option value="AUDIT_LOG_READ">AUDIT_LOG_READ</option>
              <option value="PROD_DEPLOY">PROD_DEPLOY</option>
              <option value="USER_INVITE_BATCH">USER_INVITE_BATCH</option>
              <option value="SECRETS_ROTATE">SECRETS_ROTATE</option>
            </select>
          </div>
        </div>

        <div className="p-md bg-surface-container-low flex justify-between items-center border-t border-border-subtle shrink-0">
          <button
            type="button"
            className="text-[12px] font-label-bold text-outline hover:text-on-surface cursor-pointer"
            onClick={onResetFilters}
          >
            Reset Filters
          </button>
          <button
            type="button"
            className="h-9 px-lg rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs"
            onClick={onClose}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
