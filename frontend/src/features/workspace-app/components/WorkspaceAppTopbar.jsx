import { useState, useRef, useEffect } from 'react';

export default function WorkspaceAppTopbar({
  workspace,
  currentUser,
  personas = [],
  onSwitchPersona,
  unreadAnnouncementsCount = 0,
  onAnnouncementsClick,
  onLogout,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const userName = currentUser?.name || 'Diana Morales';
  const userRole = currentUser?.role || 'Lead Architect';
  const userEmail = currentUser?.email || 'diana.m@acme.corp';
  const isTeamAdmin = currentUser?.isTeamAdmin;
  const teamRoleTitle = currentUser?.teamRoleTitle || (isTeamAdmin ? 'Team Admin' : 'Developer');
  const initials = currentUser?.initials || 'DM';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-surface-container-lowest/90 backdrop-blur-sm border-b border-border-subtle z-30 flex items-center justify-between px-lg shadow-xs shrink-0 sticky top-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-xs text-[12px] text-on-surface-variant">
        <span className="font-bold text-on-surface">{workspace?.name || 'Acme Engineering'}</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span>Employee Portal</span>
      </div>

      {/* Right: Persona Switcher, Actions & User Logo */}
      <div className="flex items-center gap-sm">
        {/* Role Persona Switcher Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-border-subtle text-[11px]">
          <span className="text-on-surface-variant font-medium">Role Preview:</span>
          <select
            value={currentUser?.id || 'usr-dm'}
            onChange={(e) => onSwitchPersona?.(e.target.value)}
            className="bg-transparent font-bold text-on-surface cursor-pointer outline-none text-[11px]"
            title="Switch Workspace Persona to test permissions"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isTeamAdmin ? '👑' : p.teamRoleTitle === 'Viewer' ? '👁️' : '💻'} {p.name} ({p.teamRoleTitle})
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onAnnouncementsClick}
          className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          title="Bulletins & Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadAnnouncementsCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadAnnouncementsCount}
            </span>
          )}
        </button>

        {/* Top-Right User Logo & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-xs p-0.5 rounded-full border border-border-subtle hover:border-outline hover:bg-surface-container-low transition-colors cursor-pointer"
            title="Account & Profile"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-label-bold text-label-sm shrink-0 ${
                isTeamAdmin
                  ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              {initials}
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-md py-2 border-b border-border-subtle">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-label-bold text-on-surface truncate">{userName}</p>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                      isTeamAdmin
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {teamRoleTitle}
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant truncate">{userEmail}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                  {userRole}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    alert('Profile preferences opened.');
                  }}
                  className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    settings
                  </span>
                  <span>Preferences</span>
                </button>
              </div>

              <div className="border-t border-border-subtle pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout?.();
                  }}
                  className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-error hover:bg-error-container/30 transition-colors cursor-pointer text-left font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
