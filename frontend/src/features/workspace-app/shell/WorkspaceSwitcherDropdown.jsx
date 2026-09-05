import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useApp } from '@/context/useApp';

export default function WorkspaceSwitcherDropdown({
  currentWorkspace,
  onOpenTeamSettings,
  placement = 'bottom-left',
  trigger,
}) {
  const { selectWorkspace, clearWorkspace, isSuperAdmin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Current active workspace ID
  const currentId = currentWorkspace?._id || currentWorkspace?.id;

  // Fetch workspaces when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadWorkspaces() {
      setLoading(true);
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
          iconBgColor: t.iconBgColor || 'bg-primary/10 text-primary',
        }));
        if (isMounted) {
          setWorkspaces(formatted);
        }
      } catch (err) {
        console.warn('Failed to load teams for switcher:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWorkspaces();
    return () => {
      isMounted = false;
    };
  }, [isOpen, isSuperAdmin]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (ws) => {
    setIsOpen(false);
    if ((ws.id || ws._id) !== currentId) {
      selectWorkspace(ws);
    }
  };

  const handleGoToHub = () => {
    setIsOpen(false);
    clearWorkspace();
  };

  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.role && w.role.toLowerCase().includes(search.toLowerCase()))
  );

  const placementClasses =
    placement === 'bottom-right'
      ? 'right-0 top-full mt-2'
      : placement === 'sidebar'
      ? 'left-0 bottom-full mb-2 w-72'
      : 'left-0 top-full mt-2';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Custom or Default Trigger */}
      {trigger ? (
        trigger({ isOpen, toggle: () => setIsOpen((prev) => !prev) })
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border-subtle hover:border-primary/40 hover:bg-surface-container-low transition-all cursor-pointer text-left ${
            isOpen ? 'bg-surface-container-low border-primary/50 ring-1 ring-primary/20' : 'bg-surface-container-lowest'
          }`}
          title="Switch workspace / team"
        >
          <div className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse"></div>
          <span className="font-bold text-on-surface text-[13px] max-w-40 truncate">
            {currentWorkspace?.name || 'Workspace'}
          </span>
          <span
            className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          >
            expand_more
          </span>
        </button>
      )}

      {/* Switcher Dropdown Modal / Popover */}
      {isOpen && (
        <div
          className={`absolute ${placementClasses} w-80 bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-subtle py-2 z-60 animate-in fade-in zoom-in-95 duration-150 flex flex-col`}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
            <div>
              <p className="font-label-bold text-[12px] uppercase tracking-wider text-on-surface-variant">
                Switch Workspace
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {workspaces.length > 0 ? `${workspaces.length} active teams available` : 'Select your workspace'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGoToHub}
              className="px-2 py-1 rounded-md text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 cursor-pointer"
              title="Return to Workspace Directory"
            >
              <span className="material-symbols-outlined text-[14px]">grid_view</span>
              All Workspaces
            </button>
          </div>

          {/* Search Input (if multiple workspaces) */}
          {workspaces.length > 3 && (
            <div className="p-2 border-b border-border-subtle">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-border-subtle text-[12px]">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Filter teams or roles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-on-surface placeholder:text-on-surface-variant text-[12px]"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Workspace List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-border-subtle/40">
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-on-surface-variant text-[12px]">
                <span className="material-symbols-outlined animate-spin text-primary text-[20px]">
                  progress_activity
                </span>
                <span>Loading your teams...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-on-surface-variant text-[12px]">
                {search ? 'No teams matching search' : 'No teams found'}
              </div>
            ) : (
              filtered.map((ws) => {
                const isCurrent = (ws.id || ws._id) === currentId;
                return (
                  <button
                    key={ws.id || ws._id}
                    type="button"
                    onClick={() => handleSelect(ws)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-primary/10 border border-primary/30 shadow-2xs'
                        : 'hover:bg-surface-container-low border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[12px] shrink-0 ${
                          isCurrent
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {ws.icon || 'domain'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[13px] font-bold truncate ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
                            {ws.name}
                          </p>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary text-on-primary uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              ws.isTeamAdmin
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {ws.role || 'Member'}
                          </span>
                          {ws.region && <span className="text-[10px]">• {ws.region}</span>}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                        check_circle
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant/40 hover:text-on-surface text-[16px] shrink-0">
                        arrow_forward
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-1.5 border-t border-border-subtle flex flex-col gap-0.5 bg-surface-container-low/40 rounded-b-2xl">
            {onOpenTeamSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenTeamSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-on-surface hover:bg-surface-container font-medium transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  settings
                </span>
                <span>Team Settings &amp; Governance</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGoToHub}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] text-primary hover:bg-primary/10 font-bold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  apps
                </span>
                <span>Switch Workspace Hub</span>
              </div>
              <span className="material-symbols-outlined text-[14px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
