function CreateUserAuthoritySection({ isSuperAdmin, onChange }) {
  return (
    <div className="flex flex-col gap-md">
      <h3 className="font-label-bold text-label-bold uppercase tracking-wider text-[11px] text-on-surface-variant">
        Platform Authority
      </h3>
      <div className="flex items-start gap-sm bg-warning-bg border border-warning-text/20 p-md rounded-lg">
        <input
          checked={isSuperAdmin}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer accent-primary"
          id="superadmin"
          type="checkbox"
        />
        <div className="flex flex-col">
          <label className="font-label-bold text-body-base text-on-surface cursor-pointer flex items-center gap-xs" htmlFor="superadmin">
            Grant Platform Super Admin Privileges <span className="material-symbols-outlined text-warning-text text-[16px]">local_police</span>
          </label>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Gives unrestricted wildcard access to platform settings &amp; all teams. Proceed with caution.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateUserAuthoritySection;
