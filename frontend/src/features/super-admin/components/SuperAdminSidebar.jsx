import { SUPER_ADMIN_NAV_ITEMS } from '../constants/superAdmin.constants';

export default function SuperAdminSidebar({ activeNav = 'dashboard', onSelectNav, onLogout }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50">
      <div className="p-lg flex items-center gap-sm">
        <img
          alt="Logo"
          className="h-8 w-auto object-contain mix-blend-multiply"
          src="/b2b_saas_logo.png"
        />
        <div className="flex flex-col">
          <span className="font-label-bold text-on-surface">Platform Control</span>
          <span className="px-xs py-[2px] bg-primary text-[10px] text-on-primary rounded-full w-fit uppercase font-bold tracking-wider">
            Super Admin
          </span>
        </div>
      </div>

      <nav
        className="flex-1 px-sm mt-md space-y-base"
        data-active-classes="bg-secondary-container text-on-secondary-container font-label-bold"
      >
        {SUPER_ADMIN_NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <a
              key={item.id}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-sm px-md py-sm rounded-lg transition-colors cursor-pointer ${
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
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-body-base">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="px-lg py-md border-t border-surface-variant mt-auto space-y-md">
        <div className="flex items-center gap-xs px-base">
          <div className="w-2 h-2 rounded-full bg-success-text"></div>
          <span className="text-label-sm text-on-surface-variant">
            All systems operational
          </span>
        </div>
        <a
          className="flex items-center gap-sm px-md py-sm rounded-lg text-error hover:bg-error-bg transition-colors cursor-pointer"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (onLogout) onLogout();
          }}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label-bold">Log Out</span>
        </a>
      </div>
    </aside>
  );
}
