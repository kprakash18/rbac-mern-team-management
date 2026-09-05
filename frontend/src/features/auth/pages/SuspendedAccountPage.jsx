import { useApp } from '@/context/useApp';

export default function SuspendedAccountPage({ user, onLogout }) {
  const { logout } = useApp();
  const handleLogout = onLogout || logout;

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col justify-between">
      {/* Header */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20">
        <div className="h-16 max-w-7xl mx-auto px-container-margin flex items-center justify-between">
          <div className="flex items-center gap-stack-md">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/b2b_saas_logo.png"
            />
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
              Enterprise SaaS
            </span>
          </div>
        </div>
      </header>

      {/* Center Card */}
      <main className="flex-1 flex items-center justify-center p-md">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-error/20 p-8 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[36px]">block</span>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-2">
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
              Account Suspended
            </h1>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Your account (<strong className="text-on-surface font-medium">{user?.email || 'this account'}</strong>) has been temporarily suspended by an administrator.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle w-full text-left text-body-sm text-on-surface-variant flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-error font-medium">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Access Restricted</span>
            </div>
            <p className="text-[12px] leading-normal text-on-surface-variant">
              You cannot access workspaces or execute actions while your account status is suspended. If you believe this is an error, please reach out to your organization administrator.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-label-bold text-label-md hover:opacity-90 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Log Out / Switch Account</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-4 border-t border-outline-variant/20 text-center text-on-surface-variant text-label-sm">
        <span>© 2024 Enterprise SaaS. All rights reserved.</span>
      </footer>
    </div>
  );
}
