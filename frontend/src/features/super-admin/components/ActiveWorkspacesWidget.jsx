import { useState } from 'react';

export default function ActiveWorkspacesWidget({
  workspaces = [],
  loading = false,
  onCreateWorkspaceClick,
  onEditWorkspaceClick,
  onJumpInWorkspace,
}) {
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'archived' | 'all'

  const activeCount = workspaces.filter((w) => w.status !== 'Archived').length;
  const archivedCount = workspaces.filter((w) => w.status === 'Archived').length;

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (filterTab === 'active') return ws.status !== 'Archived';
    if (filterTab === 'archived') return ws.status === 'Archived';
    return true;
  });

  return (
    <div className="flex-1 lg:w-[35%] flex flex-col gap-md">
      {/* Header & Create Action */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="font-headline-md text-on-surface font-semibold">Workspaces</h2>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold">
            {workspaces.length}
          </span>
        </div>
        <div className="flex items-center gap-xs">
          {onCreateWorkspaceClick && (
            <button
              type="button"
              onClick={onCreateWorkspaceClick}
              className="px-2.5 py-1 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-bold text-label-sm flex items-center gap-1 transition-opacity cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Create</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg self-start text-[12px] font-label-bold">
        <button
          type="button"
          onClick={() => setFilterTab('active')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filterTab === 'active'
              ? 'bg-surface-container-lowest text-on-surface shadow-2xs font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('archived')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filterTab === 'archived'
              ? 'bg-surface-container-lowest text-on-surface shadow-2xs font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Archived ({archivedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filterTab === 'all'
              ? 'bg-surface-container-lowest text-on-surface shadow-2xs font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All ({workspaces.length})
        </button>
      </div>

      {/* Workspaces List */}
      <div className="bg-card-bg shadow-sm rounded-xl overflow-hidden w-full flex flex-col border border-border-subtle/50">
        {loading ? (
          <div className="p-xl text-center flex flex-col items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary text-[28px]">progress_activity</span>
            <span className="text-body-sm">Loading workspaces...</span>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="p-xl text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[32px]">folder_off</span>
            <span className="text-body-sm text-on-surface-variant">
              No {filterTab} workspaces found.
            </span>
          </div>
        ) : (
          filteredWorkspaces.map((ws, idx) => {
            const isArchived = ws.status === 'Archived';

            return (
              <div
                key={ws.id}
                className={`p-md lg:p-lg flex items-center justify-between hover:bg-surface-container/30 transition-colors ${
                  idx < filteredWorkspaces.length - 1 ? 'border-b border-border-subtle/50' : ''
                } group`}
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-md min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-surface-container-high transition-colors shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {ws.icon || 'engineering'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-label-bold text-on-surface truncate">{ws.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isArchived
                            ? 'bg-neutral-200 text-neutral-700'
                            : ws.tier === 'Vault Tier' || ws.tier === 'High Security' || ws.status === 'High Security'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ws.status || 'Active'}
                      </span>
                    </div>
                    <span className="font-body-sm text-[12px] text-on-surface-variant truncate">
                      {ws.membersCount || 1} Members · {ws.tier || 'Standard RBAC'}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Settings / Edit button */}
                  {onEditWorkspaceClick && (
                    <button
                      type="button"
                      onClick={() => onEditWorkspaceClick(ws)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                      title={`Configure ${ws.name}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                    </button>
                  )}

                  {/* Jump In action */}
                  {!isArchived ? (
                    <button
                      type="button"
                      onClick={() => onJumpInWorkspace?.(ws)}
                      className="bg-primary text-on-primary px-2.5 py-1 rounded-lg font-label-bold text-label-sm flex items-center gap-1 cursor-pointer hover:opacity-90 shadow-2xs transition-all"
                    >
                      <span>Jump In</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEditWorkspaceClick?.(ws)}
                      className="text-on-surface-variant border border-border-subtle px-2 py-1 rounded-lg font-label-bold text-[11px] hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      Archived
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-xs bg-surface-container/50 rounded-xl p-lg flex items-center gap-md relative overflow-hidden border border-border-subtle/40">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <span className="material-symbols-outlined text-primary text-[32px] relative z-10">info</span>
        <div className="flex flex-col relative z-10">
          <span className="font-label-bold text-on-surface">System Maintenance</span>
          <span className="font-body-sm text-on-surface-variant text-[12px]">
            Scheduled for Sunday, 02:00 AM UTC. Expect 15m downtime.
          </span>
        </div>
      </div>
    </div>
  );
}
