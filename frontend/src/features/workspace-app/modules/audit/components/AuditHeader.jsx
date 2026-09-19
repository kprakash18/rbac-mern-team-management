function AuditHeader({ onExportCSV, onExportJSON, workspace }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-border-subtle pb-md">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">Workspace Audit Trail</h1>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold">{workspace?.name || 'Acme Engineering'}</span>
        </div>
        <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
          Cryptographically sealed activity log of all access grants, membership changes, and operational tasks.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onExportCSV} className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-container-lowest hover:bg-surface-container text-on-surface text-label-sm font-label-bold flex items-center gap-1.5 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">download</span><span>Export CSV</span>
        </button>
        <button type="button" onClick={onExportJSON} className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-container-lowest hover:bg-surface-container text-on-surface text-label-sm font-label-bold flex items-center gap-1.5 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">code</span><span>JSON</span>
        </button>
      </div>
    </div>
  );
}

export default AuditHeader;
