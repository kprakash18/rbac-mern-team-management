function AuditAccessDenied({ onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-lg text-center">
      <div className="w-14 h-14 rounded-full bg-error-container/30 text-error flex items-center justify-center shadow-xs">
        <span className="material-symbols-outlined text-[32px]">shield_lock</span>
      </div>
      <div>
        <h2 className="text-[18px] font-bold text-on-surface">Audit Access Restricted</h2>
        <p className="text-body-sm text-on-surface-variant max-w-md mt-1">
          Immutable workspace audit logs are restricted to Team Administrators and Security Auditors in compliance with organizational RBAC policy.
        </p>
      </div>
      <button type="button" onClick={() => onNavigate?.('dashboard')} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer mt-2">
        Return to Dashboard
      </button>
    </div>
  );
}

export default AuditAccessDenied;
