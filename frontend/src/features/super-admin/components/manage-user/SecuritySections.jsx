function CheckboxCard({ checked, description, id, label, onChange }) {
  return (
    <div className="flex items-start gap-sm p-md bg-surface-container-low rounded-lg shadow-sm">
      <div className="relative flex items-center mt-0.5">
        <input
          className="peer appearance-none w-5 h-5 bg-surface-container-lowest shadow-sm rounded cursor-pointer checked:bg-primary transition-colors border border-border-subtle"
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="material-symbols-outlined absolute inset-0 text-on-primary text-[18px] opacity-0 peer-checked:opacity-100 pointer-events-none flex items-center justify-center font-bold">
          check
        </span>
      </div>
      <div className="flex flex-col gap-base">
        <label className="font-label-bold text-on-surface cursor-pointer select-none" htmlFor={id}>
          {label}
        </label>
        {description && (
          <p className="font-body-sm text-on-surface-variant">{description}</p>
        )}
      </div>
    </div>
  );
}

export function PlatformAuthoritySection({ isSuperAdmin, onChange }) {
  return (
    <div className="flex flex-col gap-sm">
      <label className="font-label-bold text-on-surface">Platform Authority</label>
      <CheckboxCard
        checked={isSuperAdmin}
        description="Gives unrestricted wildcard access to platform settings &amp; all teams."
        id="super-admin-cb"
        label="Grant Platform Super Admin Privileges"
        onChange={onChange}
      />
    </div>
  );
}

export function SessionSecuritySection({
  mustChangePassword,
  onForceLogout,
  onPasswordResetChange,
  sessionsTerminated,
}) {
  return (
    <div className="flex flex-col gap-sm">
      <label className="font-label-bold text-on-surface">Security &amp; Sessions</label>
      <div className="flex flex-col gap-md p-md bg-surface-container-low rounded-lg shadow-sm">
        <div className="flex items-start gap-sm">
          <div className="relative flex items-center mt-0.5">
            <input
              className="peer appearance-none w-5 h-5 bg-surface-container-lowest shadow-sm rounded cursor-pointer checked:bg-primary transition-colors border border-border-subtle"
              id="pw-reset-cb"
              type="checkbox"
              checked={mustChangePassword}
              onChange={(event) => onPasswordResetChange(event.target.checked)}
            />
            <span className="material-symbols-outlined absolute inset-0 text-on-primary text-[18px] opacity-0 peer-checked:opacity-100 pointer-events-none flex items-center justify-center font-bold">
              check
            </span>
          </div>
          <label className="font-label-bold text-on-surface cursor-pointer select-none" htmlFor="pw-reset-cb">
            Force password reset on next login
          </label>
        </div>
        <div className="w-full h-px bg-surface-variant my-xs"></div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-base">
            <span className="font-label-bold text-error">Terminate Sessions</span>
            <span className="font-body-sm text-on-surface-variant">
              {sessionsTerminated
                ? 'Sessions will be invalidated upon saving.'
                : 'Invalidates all active sessions immediately.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onForceLogout}
            className={`px-md py-sm rounded-lg shadow-sm transition-colors flex items-center gap-xs font-label-bold cursor-pointer ${
              sessionsTerminated
                ? 'bg-success-bg text-success-text'
                : 'bg-error-container hover:bg-error-bg text-on-error-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {sessionsTerminated ? 'check' : 'logout'}
            </span>
            {sessionsTerminated ? 'Terminated' : 'Force Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
