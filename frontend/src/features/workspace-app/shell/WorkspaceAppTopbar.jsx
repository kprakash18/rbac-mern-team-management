import { useState, useRef, useEffect } from 'react';
import NotificationDropdown from './NotificationDropdown';
import WorkspaceSwitcherDropdown from './WorkspaceSwitcherDropdown';
import { useApp } from '@/context/useApp';

export default function WorkspaceAppTopbar({
  workspace,
  currentUser,
  onAnnouncementsClick,
  onOpenTeamSettings,
  onSelectTab,
  onLogout,
}) {
  const { clearWorkspace } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const userName = currentUser?.name || 'User';
  const userRole = currentUser?.role || 'Member';
  const userEmail = currentUser?.email || '';
  const isTeamAdmin = currentUser?.isTeamAdmin || currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const teamRoleTitle = currentUser?.teamRoleTitle || (isTeamAdmin ? 'Admin' : 'Member');
  const initials = currentUser?.initials || (currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U');

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
      {/* Left: Breadcrumb with Workspace Switcher */}
      <div className="flex items-center gap-xs text-[12px] text-on-surface-variant">
        <WorkspaceSwitcherDropdown
          currentWorkspace={workspace}
          onOpenTeamSettings={isTeamAdmin ? onOpenTeamSettings : undefined}
          placement="bottom-left"
        />
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="hidden sm:inline">Employee Portal</span>
      </div>

      {/* Right: Actions & User Logo */}
      <div className="flex items-center gap-sm">
        {/* Notification Bell Dropdown */}
        <NotificationDropdown
          currentUser={currentUser}
          onSelectTab={onSelectTab || onAnnouncementsClick}
        />

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
                {userEmail && <p className="text-[12px] text-on-surface-variant truncate">{userEmail}</p>}
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                  {userRole}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    clearWorkspace();
                  }}
                  className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left font-medium"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    apps
                  </span>
                  <span>Switch Workspace Hub</span>
                </button>
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
