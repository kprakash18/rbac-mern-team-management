
const WORKSPACE_APP_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'team-members', label: 'Team & Members', icon: 'group' },
  { id: 'my-permissions', label: 'Permissions & RBAC', icon: 'verified_user' },
  { id: 'jit-request', label: 'JIT Access', icon: 'bolt', hasIndicator: true },
  { id: 'announcements', label: 'System Bulletins', icon: 'campaign', hasBadge: true },
  { id: 'audit-log', label: 'Audit Log', icon: 'receipt_long' },
];

export default function WorkspaceAppSidebar({
  workspace,
  currentUser,
  activeView,
  onSelectView,
  onLogout,
  unreadAnnouncementsCount = 2,
}) {
  const userName = currentUser?.name || 'Diana Morales';
  const userRole = currentUser?.role || 'Lead Architect';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const workspaceName = workspace?.name || 'Acme Engineering';

  return (
    <aside className="w-72 shrink-0 bg-surface-container-lowest border-r border-border-subtle h-screen sticky top-0 flex flex-col justify-between p-lg z-40 hidden md:flex">
      <div className="flex flex-col gap-lg">
        {/* Brand Header */}
        <div className="flex items-center gap-sm">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface leading-none tracking-tight">ACME</span>
            <span className="text-[11px] font-mono text-on-surface-variant tracking-wider uppercase">Enterprise OS</span>
          </div>
        </div>

        {/* Workspace Switcher Pill */}
        <div className="p-sm rounded-lg bg-surface-container-low border border-border-subtle flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-xs min-w-0">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
            <div className="truncate">
              <p className="font-label-bold text-label-bold text-on-surface truncate">{workspaceName}</p>
              <p className="text-[11px] font-mono text-on-surface-variant truncate">Prod US-East</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">unfold_more</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {WORKSPACE_APP_NAV.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex items-center justify-between px-md py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-label-bold text-label-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-body-base text-body-base'
                }`}
              >
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.hasIndicator && (
                  <span className="w-2 h-2 rounded-full bg-warning-text"></span>
                )}
                {item.hasBadge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-warning-bg text-on-tertiary-fixed font-bold text-[10px]">
                    {unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : 2}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="flex flex-col gap-md pt-md border-t border-border-subtle">
        <div className="flex items-center justify-between pt-xs">
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-label-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-label-bold text-label-bold text-on-surface leading-tight truncate">{userName}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight truncate">{userRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-xs rounded-lg text-on-surface-variant hover:text-error-text hover:bg-error-bg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            )}
            <button
              type="button"
              className="p-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Preferences"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
