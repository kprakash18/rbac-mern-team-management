import { SUPER_ADMIN_NAV_ITEMS } from '../constants/superAdmin.constants';

export default function SuperAdminSidebar({ activeNav = 'dashboard', onSelectNav, onLogout, isOpen = true, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-container-lowest flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 transition-all duration-300 ${
        isOpen ? 'w-72' : 'w-20'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center border-b border-surface-variant/40 transition-all duration-300 ${isOpen ? 'p-lg justify-between gap-sm' : 'py-lg px-2 flex-col gap-xs items-center justify-center'}`}>
        {isOpen ? (
          <>
            <div className="flex items-center gap-sm overflow-hidden">
              <img
                alt="Logo"
                className="h-8 w-auto object-contain mix-blend-multiply shrink-0"
                src="/b2b_saas_logo.png"
              />
              <div className="flex flex-col truncate">
                <span className="font-label-bold text-on-surface truncate">Platform Control</span>
                <span className="px-xs py-[2px] bg-primary text-[10px] text-on-primary rounded-full w-fit uppercase font-bold tracking-wider">
                  Super Admin
                </span>
              </div>
            </div>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
                title="Collapse to icons"
              >
                <span className="material-symbols-outlined text-[20px]">menu_open</span>
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-sm">
            <img
              alt="Logo"
              className="h-7 w-7 object-contain mix-blend-multiply"
              src="/b2b_saas_logo.png"
            />
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav
        className={`flex-1 mt-md space-y-xs transition-all duration-300 ${isOpen ? 'px-sm' : 'px-2'}`}
      >
        {SUPER_ADMIN_NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <div key={item.id} className="relative group/nav">
              <a
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center rounded-lg transition-all cursor-pointer ${
                  isOpen
                    ? 'gap-sm px-md py-sm'
                    : 'justify-center h-11 w-full'
                } ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-label-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                data-path={item.path}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectNav) onSelectNav(item.id);
                }}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {isOpen && <span className="font-body-base truncate">{item.label}</span>}
              </a>

              {/* Tooltip when collapsed */}
              {!isOpen && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover/nav:flex z-[100] whitespace-nowrap bg-inverse-surface text-inverse-on-surface font-label-sm text-[12px] px-2.5 py-1 rounded-md shadow-lg pointer-events-none">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-surface-variant mt-auto space-y-md transition-all duration-300 ${isOpen ? 'px-lg py-md' : 'px-2 py-md flex flex-col items-center'}`}>
        {isOpen ? (
          <div className="flex items-center gap-xs px-base">
            <div className="w-2 h-2 rounded-full bg-success-text shrink-0"></div>
            <span className="text-label-sm text-on-surface-variant truncate">
              All systems operational
            </span>
          </div>
        ) : (
          <div className="relative group/status py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-success-text"></div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover/status:flex z-[100] whitespace-nowrap bg-inverse-surface text-inverse-on-surface font-label-sm text-[11px] px-2 py-1 rounded shadow-md pointer-events-none">
              All systems operational
            </div>
          </div>
        )}

        <div className="relative group/logout w-full">
          <a
            className={`flex items-center rounded-lg text-error hover:bg-error-bg transition-colors cursor-pointer ${
              isOpen
                ? 'gap-sm px-md py-sm'
                : 'justify-center h-10 w-full'
            }`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onLogout) onLogout();
            }}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {isOpen && <span className="font-label-bold">Log Out</span>}
          </a>

          {!isOpen && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover/logout:flex z-[100] whitespace-nowrap bg-error-bg text-error-text font-label-sm text-[12px] px-2.5 py-1 rounded-md shadow-md pointer-events-none">
              Log Out
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
