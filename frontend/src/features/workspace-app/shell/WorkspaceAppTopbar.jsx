import { useState, useRef, useEffect } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { UserProfileSettingsModal } from '@/shared/components';
import { useApp } from '@/context/AppContext';
import api from '@/lib/api';

export default function WorkspaceAppTopbar({
  workspace,
  currentUser,
  onAnnouncementsClick,
  onOpenTeamSettings,
  onSelectTab,
  onLogout,
}) {
  const { selectWorkspace, clearWorkspace, isSuperAdmin } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch workspaces when profile dropdown opens
  useEffect(() => {
    if (!isMenuOpen) return;
    let isMounted = true;
    async function loadWorkspaces() {
      try {
        const endpoint = isSuperAdmin ? '/api/teams' : '/api/teams/my-teams';
        const res = await api.get(endpoint);
        const rawTeams = res.data?.data?.teams || res.data?.data || [];
        const formatted = rawTeams.map((t) => ({
          ...t,
          id: t._id || t.id,
          name: t.name,
          role: t.role || (t.isTeamAdmin ? 'Team Admin' : 'Developer'),
          isTeamAdmin: Boolean(
            t.isTeamAdmin || t.role === 'Team Admin' || t.role?.toLowerCase().includes('admin')
          ),
          icon: t.icon || 'domain',
        }));
        if (isMounted) setWorkspaces(formatted);
      } catch (err) {
        console.warn('Failed to load workspaces:', err);
      }
    }
    loadWorkspaces();
    return () => {
      isMounted = false;
    };
  }, [isMenuOpen, isSuperAdmin]);

  const userName = currentUser?.name || 'Workspace User';
  const userEmail = currentUser?.email || '';
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const userRole = currentUser?.role || 'Member';
  const teamRoleTitle = isTeamAdmin ? 'Team Admin' : userRole;

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="h-16 border-b border-border-subtle bg-surface-container-low/80 backdrop-blur-md px-lg flex items-center justify-between sticky top-0 z-30 shrink-0">
        {/* Left: Workspace Info (Static) */}
        <div className="flex items-center gap-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-bold text-sm text-on-surface leading-tight">
              {workspace?.name || 'Workspace'}
            </span>
            <span className="text-[11px] text-on-surface-variant font-mono">
              {workspace?.region || 'Prod US-East'}
            </span>
          </div>
        </div>

        {/* Right: Notifications & Profile */}
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
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="px-md py-2 border-b border-border-subtle cursor-pointer hover:bg-surface-container-low transition-colors"
                  title="Click to manage account settings"
                >
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

                {/* Switch Workspace Section inside Profile Dropdown */}
                {workspaces.length > 0 && (
                  <div className="py-1 border-b border-border-subtle">
                    <div className="px-md py-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Switch Workspace
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          clearWorkspace();
                        }}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        All Hubs
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto px-1 space-y-0.5">
                      {workspaces.map((ws) => {
                        const isCurrent = (ws.id || ws._id) === (workspace?._id || workspace?.id);
                        return (
                          <button
                            key={ws.id || ws._id}
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (!isCurrent) selectWorkspace(ws);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs ${
                              isCurrent
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-on-surface hover:bg-surface-container-low font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-[16px] shrink-0">
                                {ws.icon || 'domain'}
                              </span>
                              <span className="truncate">{ws.name}</span>
                            </div>
                            {isCurrent && (
                              <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      manage_accounts
                    </span>
                    <span>Profile &amp; Security Settings</span>
                  </button>
                  {isTeamAdmin && onOpenTeamSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenTeamSettings();
                      }}
                      className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                        settings
                      </span>
                      <span>Team Settings &amp; Governance</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      clearWorkspace();
                    }}
                    className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      apps
                    </span>
                    <span>Switch Workspace Hub</span>
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

      {/* User Profile & Password Change Settings Modal */}
      <UserProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={onLogout}
      />
    </>
  );
}
