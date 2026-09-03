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
  workspace,
  activeView,
  onSelectView,
  unreadAnnouncementsCount = 2,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const workspaceName = workspace?.name || 'Acme Engineering';

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

        {/* Workspace Switcher Pill */}
        {isCollapsed ? (
          <div className="w-full flex justify-center py-1">
            <div
              className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"
              title={`${workspaceName} - Prod US-East`}
            ></div>
          </div>
        ) : (
          <div className="p-sm rounded-lg bg-surface-container-low border border-border-subtle flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-xs min-w-0">
              <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
              <div className="truncate">
                <p className="font-label-bold text-label-bold text-on-surface truncate">
                  {workspaceName}
                </p>
                <p className="text-[11px] font-mono text-on-surface-variant truncate">
                  Prod US-East
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              unfold_more
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className={`flex flex-col ${isCollapsed ? 'items-center gap-1.5' : 'gap-1'} w-full`}>
          {WORKSPACE_APP_NAV.map((item) => {
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

      {/* Bottom area: Clean minimal status indicator when collapsed or expanded, with no user footer */}
      <div className="py-2 flex items-center justify-center border-t border-border-subtle">
        <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
          {isCollapsed ? 'v2.4' : 'ACME OS • v2.4.1'}
        </span>
      </div>
    </aside>
  );
}
