import { useState, useRef, useEffect } from 'react';
import NotificationDropdown from '../../workspace-app/shell/NotificationDropdown';

export default function SuperAdminTopbar({
  onCreateTeam,
  onBroadcast,
  isSidebarOpen = true,
  currentUser,
  onLogout,
  onSelectNav,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const initials =
    currentUser?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SA';

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tab) => {
    if (tab === 'jit-request' || tab === 'jit-access') {
      if (onSelectNav) onSelectNav('jit-access');
    } else if (tab === 'team-members' || tab === 'users') {
      if (onSelectNav) onSelectNav('users-access');
    } else if (tab === 'announcements' || tab === 'broadcasts') {
      if (onSelectNav) onSelectNav('system-broadcasts');
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-xl transition-all duration-300 ${
        isSidebarOpen ? 'left-72' : 'left-20'
      }`}
    >
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border-none rounded-lg pl-xl pr-md py-xs text-body-base focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="Search fleet, users, or logs..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-lg ml-xl">
        <div className="flex items-center gap-sm border-r border-surface-variant pr-lg">
          <button
            onClick={onCreateTeam}
            className="flex items-center gap-xs px-md py-xs bg-primary text-on-primary rounded-lg font-label-bold hover:bg-on-primary-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Team
          </button>
          <button
            onClick={onBroadcast}
            className="flex items-center gap-xs px-md py-xs border border-outline rounded-lg font-label-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            Broadcast
          </button>
        </div>

        {/* Real-time Interactive Notification Dropdown */}
        <NotificationDropdown
          currentUser={currentUser}
          onSelectTab={handleSelectTab}
        />

        {/* User Profile Menu */}
        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-sm cursor-pointer hover:bg-surface-container p-base rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-bold text-label-sm shadow-xs">
              {initials}
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              expand_more
            </span>
          </div>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-border-subtle rounded-xl shadow-xl z-50 p-sm animate-in fade-in zoom-in-95 duration-150">
              <div className="p-sm border-b border-border-subtle mb-1">
                <span className="font-label-bold text-label-sm text-on-surface block truncate">
                  {currentUser?.name || 'Super Admin'}
                </span>
                <span className="text-[11px] text-on-surface-variant block truncate">
                  {currentUser?.email || 'admin@platform.local'}
                </span>
                <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-wider">
                  Super Admin
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center gap-2 p-sm rounded-lg text-error hover:bg-error-bg font-label-bold text-label-sm transition-colors cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
