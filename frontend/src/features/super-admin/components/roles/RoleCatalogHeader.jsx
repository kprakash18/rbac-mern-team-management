export default function RoleCatalogHeader({ onExportPolicies, onCreateRole }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
      <div>
        <div className="flex items-center gap-xs text-body-sm text-on-surface-variant mb-1">
          <span>Platform Control</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-primary">Roles &amp; Permissions</span>
        </div>
        <h1 className="font-display-title text-on-surface flex items-center gap-2">
          <span>Roles &amp; Permissions Catalog</span>
          <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-bold text-label-sm">
            RBAC v2.4
          </span>
        </h1>
        <p className="font-body-base text-on-surface-variant mt-1">
          Configure system and bespoke custom roles, assign granular permissions, and inspect access boundary matrices.
        </p>
      </div>

      <div className="flex items-center gap-sm shrink-0">
        <button
          type="button"
          onClick={onExportPolicies}
          className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container flex items-center gap-2 transition-colors cursor-pointer border border-border-subtle"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>Export Policies</span>
        </button>
        <button
          type="button"
          onClick={onCreateRole}
          className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_moderator</span>
          <span>Create Custom Role</span>
        </button>
      </div>
    </div>
  );
}
