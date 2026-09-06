const WORKSPACE_APP_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'tasks', label: 'Tasks & Sprints', icon: 'task_alt' },
  { id: 'team-members', label: 'Team & Members', icon: 'group' },
  { id: 'chat', label: 'Team Chat', icon: 'forum' },
  { id: 'jit-request', label: 'JIT Access', icon: 'bolt', hasIndicator: true },
  { id: 'announcements', label: 'System Bulletins', icon: 'campaign', hasBadge: true },
  { id: 'audit-log', label: 'Audit Log', icon: 'receipt_long' },
];

export default function WorkspaceAppSidebar({
  currentUser,
  activeView,
  onSelectView,
  unreadAnnouncementsCount = 2,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const isAuditorOrAdmin =
    isTeamAdmin ||
    currentUser?.teamRole === 'Security Auditor' ||
    currentUser?.role === 'Security Auditor' ||
    (typeof currentUser?.hasPermission === 'function' && currentUser.hasPermission('audit.read'));

  const navItems = WORKSPACE_APP_NAV.filter((item) => {
    if (item.id === 'audit-log') {
      return isAuditorOrAdmin;
    }
    return true;
  });

  return (
    <aside
      className={`shrink-0 bg-surface-container-lowest border-r border-border-subtle h-screen sticky top-0 flex flex-col justify-between z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20 p-2' : 'w-72 p-lg'
      }`}
      id="main-sidebar"
    >
      <div className={`flex flex-col ${isCollapsed ? 'items-center gap-md' : 'gap-lg'} w-full`}>
        {/* Brand & Toggle Header */}
        <div
          className={`flex items-center ${
            isCollapsed
              ? 'flex-col items-center gap-xs pb-xs border-b border-border-subtle w-full'
              : 'justify-between pb-sm border-b border-border-subtle'
          }`}
        >
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md text-on-surface leading-none tracking-tight">
                  ACME
                </span>
                <span className="text-[11px] font-mono text-on-surface-variant tracking-wider uppercase">
                  Enterprise OS
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCollapsed ? 'menu' : 'menu_open'}
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={`flex flex-col ${isCollapsed ? 'items-center gap-1.5' : 'gap-1'} w-full`}>
          {navItems.map((item) => {
            const isActive = activeView === item.id;

            if (isCollapsed) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                  title={item.label}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.hasIndicator && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning-text"></span>
                  )}
                  {item.hasBadge && (
                    <span className="absolute top-1 right-1 px-1 py-0.2 rounded-full bg-warning-bg text-on-tertiary-fixed font-bold text-[9px]">
                      {unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : 2}
                    </span>
                  )}
                </button>
              );
            }

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
    </aside>
  );
}
