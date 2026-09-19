import { useEffect, useRef, useState } from 'react';
import NotificationDropdown from '../../../shell/NotificationDropdown';
import { UserProfileSettingsModal } from '@/shared/components';

function UserMenu({
  clearWorkspace,
  currentUser,
  isOpen,
  onNavigate,
  onOpenProfile,
  onToggle,
  selectWorkspace,
  userMenuRef,
  workspace,
  workspaces,
}) {
  const userName = currentUser?.name || 'Team Member';
  const userRole = currentUser?.role || 'Member';
  const userEmail = currentUser?.email || '';
  const isTeamAdmin = currentUser?.isTeamAdmin;
  const teamRoleTitle = currentUser?.teamRoleTitle || (isTeamAdmin ? 'Team Admin' : 'Developer');
  const userInitials = (currentUser?.initials || userName.split(' ').map((name) => name[0]).join('').slice(0, 2)).toUpperCase() || 'TM';

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-xs p-0.5 rounded-full border border-border-subtle hover:border-outline hover:bg-surface-container-low transition-colors cursor-pointer"
        title="Account & Profile"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-label-sm shrink-0">
          {userInitials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div onClick={onOpenProfile} className="px-md py-2 border-b border-border-subtle cursor-pointer hover:bg-surface-container-low transition-colors" title="Click to manage account settings">
            <div className="flex items-center justify-between gap-1">
              <p className="font-label-bold text-on-surface truncate">{userName}</p>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${isTeamAdmin ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {teamRoleTitle}
              </span>
            </div>
            {userEmail && <p className="text-[12px] text-on-surface-variant truncate">{userEmail}</p>}
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">{userRole}</span>
          </div>

          {workspaces.length > 0 && (
            <div className="py-1 border-b border-border-subtle">
              <div className="px-md py-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Switch Workspace</span>
                <button type="button" onClick={clearWorkspace} className="text-[10px] font-bold text-primary hover:underline cursor-pointer">All Hubs</button>
              </div>
              <div className="max-h-36 overflow-y-auto px-1 space-y-0.5">
                {workspaces.map((ws) => {
                  const isCurrent = (ws.id || ws._id) === (workspace?._id || workspace?.id);
                  return (
                    <button
                      key={ws.id || ws._id}
                      type="button"
                      onClick={() => !isCurrent && selectWorkspace(ws)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs ${isCurrent ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-low font-medium'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[16px] shrink-0">{ws.icon || 'domain'}</span>
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {isCurrent && <span className="material-symbols-outlined text-primary text-[16px] shrink-0">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="py-1">
            <button type="button" onClick={onOpenProfile} className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left font-medium">
              <span className="material-symbols-outlined text-[18px] text-primary">manage_accounts</span>
              <span>Profile &amp; Security Settings</span>
            </button>
            <button type="button" onClick={clearWorkspace} className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left font-medium">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">apps</span>
              <span>Switch Workspace Hub</span>
            </button>
          </div>

          <div className="border-t border-border-subtle pt-1">
            <button type="button" onClick={() => onNavigate?.('logout')} className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-error hover:bg-error-container/30 transition-colors cursor-pointer text-left font-medium">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardTopbar({
  clearWorkspace,
  currentUser,
  onNavigate,
  selectWorkspace,
  workspace,
  workspaces,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setIsUserMenuOpen(false);
  const openProfile = () => {
    closeMenu();
    setIsProfileModalOpen(true);
  };
  const clearAndClose = () => {
    closeMenu();
    clearWorkspace();
  };

  return (
    <>
      <div className="flex items-center justify-between pb-sm border-b border-border-subtle gap-md flex-wrap">
        <div className="flex items-center gap-md flex-1 max-w-lg">
          <div className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface-variant w-full shadow-sm">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <input className="w-full bg-transparent font-body-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant" placeholder="Search tasks, teammates, capabilities..." readOnly type="text" />
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button type="button" onClick={() => onNavigate?.('jit-request')} className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-sm text-label-sm transition-opacity shadow-sm cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="hidden sm:inline">Request JIT Elevation</span>
          </button>
          <NotificationDropdown currentUser={currentUser} onSelectTab={onNavigate} />
          <UserMenu
            clearWorkspace={clearAndClose}
            currentUser={currentUser}
            isOpen={isUserMenuOpen}
            onNavigate={onNavigate}
            onOpenProfile={openProfile}
            onToggle={() => setIsUserMenuOpen((prev) => !prev)}
            selectWorkspace={(selected) => {
              closeMenu();
              selectWorkspace(selected);
            }}
            userMenuRef={userMenuRef}
            workspace={workspace}
            workspaces={workspaces}
          />
        </div>
      </div>

      <UserProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={() => onNavigate?.('logout')}
      />
    </>
  );
}

export default DashboardTopbar;
