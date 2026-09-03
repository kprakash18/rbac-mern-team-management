export default function RoleCard({
  role,
  activeMenuId,
  toggleCardMenu,
  onOpenDrawer,
  onOpenCreateModal,
  onCloneRole,
  onArchiveToggle,
  onToggleStatus,
  onInitiateDelete,
}) {
  const isSystem = role.type === 'system';
  const isArchived = role.status === 'archived';

  return (
    <div
      onClick={() => onOpenDrawer(role)}
      className={`role-card bg-card-bg rounded-xl p-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden cursor-pointer border border-transparent hover:border-border-subtle group/card ${
        isArchived ? 'opacity-75' : ''
      }`}
      title="Click role to view assigned users & details"
    >
      <div className="flex flex-col gap-md">
        <div className="flex items-start justify-between gap-sm">
          <div
            className={`w-10 h-10 rounded-lg ${role.iconBg} flex items-center justify-center text-on-surface shrink-0 group-hover/card:scale-105 transition-transform`}
          >
            <span className="material-symbols-outlined text-[22px]">{role.icon}</span>
          </div>
          <div className="flex items-center gap-xs">
            {isSystem ? (
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">lock</span> SYSTEM
              </span>
            ) : isArchived ? (
              <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-sm text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">archive</span> ARCHIVED
              </span>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">bolt</span> CUSTOM
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(role.id);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-label-bold flex items-center gap-1 transition-all cursor-pointer border shadow-2xs ${
                    role.status === 'disabled'
                      ? 'bg-warning-bg text-warning-text border-warning-text/40 hover:bg-warning-bg/90'
                      : 'bg-success-bg text-success-text border-success-text/40 hover:bg-success-bg/90'
                  }`}
                  title="Click to toggle Role Status (Active / Disabled)"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {role.status === 'disabled' ? 'pause_circle' : 'check_circle'}
                  </span>
                  <span>{role.status === 'disabled' ? 'DISABLED' : 'ACTIVE'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface group-hover/card:text-primary transition-colors flex items-center justify-between">
            <span>{role.name}</span>
            <span className="material-symbols-outlined text-[18px] text-outline opacity-0 group-hover/card:opacity-100 transition-opacity">
              arrow_forward
            </span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
            {role.desc}
          </p>
        </div>

        {/* Members Assignment Indicator */}
        <div className="flex items-center justify-between pt-xs pb-xs bg-surface-container-low/60 p-2 rounded-lg transition-colors border border-border-subtle/30">
          {isArchived ? (
            <>
              <span className="font-label-sm text-label-sm text-outline">No active users</span>
              <span className="px-2 py-0.5 rounded bg-error-bg text-error-text font-label-sm text-[11px]">
                Deprecated
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center -space-x-2">
                {role.avatars?.map((av, idx) => (
                  <div
                    key={idx}
                    className={`w-7 h-7 rounded-full ${av.bg} flex items-center justify-center text-[10px] font-bold shadow-xs border border-card-bg`}
                  >
                    {av.text}
                  </div>
                ))}
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1">
                {role.members} users assigned
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </span>
            </>
          )}
        </div>

        {/* Permissions Pills */}
        <div className="flex flex-wrap gap-xs pt-xs">
          {role.permPills?.map((pill, idx) => {
            if (pill.dot) {
              return (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-md bg-surface-container-low text-on-surface font-label-sm text-[12px] flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {pill.text}
                </span>
              );
            }
            if (pill.isWarning) {
              return (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-md bg-error-bg text-error-text font-label-sm text-[12px] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">block</span> {pill.text}
                </span>
              );
            }
            return (
              <span
                key={idx}
                className="px-2 py-1 rounded-md bg-surface-container-low text-on-surface-variant font-label-sm text-[12px]"
              >
                {pill.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer & Action Buttons */}
      <div
        className="pt-lg mt-md flex items-center justify-between gap-xs border-t border-border-subtle/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="h-9 px-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-bold text-label-sm transition-colors cursor-pointer"
          onClick={() => onOpenDrawer(role, 'permissions')}
        >
          View Permissions
        </button>
        <div className="flex items-center gap-xs">
          {isSystem ? (
            <>
              <button
                className="h-9 px-xs rounded-lg hover:bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
                title="Clone Role"
                onClick={() => onCloneRole(role)}
              >
                <span className="material-symbols-outlined text-[16px]">copy_all</span>
                <span>Clone</span>
              </button>
              <div className="relative group/lock">
                <button
                  className="h-9 w-9 rounded-lg opacity-40 cursor-not-allowed text-outline flex items-center justify-center"
                  disabled
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </button>
                <div className="absolute bottom-full right-0 mb-1 hidden group-hover/lock:block z-[90] whitespace-nowrap bg-inverse-surface text-inverse-on-surface font-label-sm text-[11px] px-2 py-1 rounded shadow-md">
                  System presets cannot be modified or deleted
                </div>
              </div>
            </>
          ) : isArchived ? (
            <button
              className="h-9 px-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
              onClick={() => onArchiveToggle(role.id)}
            >
              <span className="material-symbols-outlined text-[16px]">unarchive</span>
              <span>Restore</span>
            </button>
          ) : (
            <>
              <button
                className="h-9 px-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
                onClick={() => onOpenCreateModal(role)}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit</span>
              </button>
              {/* Context Menu */}
              <div className="relative">
                <button
                  className="h-9 w-9 rounded-lg hover:bg-surface-container-low text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                  onClick={(e) => toggleCardMenu(e, `menu-${role.id}`)}
                >
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
                {activeMenuId === `menu-${role.id}` && (
                  <div className="absolute right-0 bottom-full mb-1 w-44 bg-card-bg rounded-lg shadow-xl py-1 z-[90] border border-border-subtle animate-in fade-in-50 duration-100">
                    <button
                      className="w-full text-left px-md py-1.5 text-label-sm hover:bg-surface-container-low flex items-center gap-xs text-on-surface cursor-pointer"
                      onClick={() => onToggleStatus(role.id)}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {role.status === 'disabled' ? 'play_circle' : 'pause_circle'}
                      </span>
                      <span>{role.status === 'disabled' ? 'Enable Role' : 'Disable Role'}</span>
                    </button>
                    <button
                      className="w-full text-left px-md py-1.5 text-label-sm hover:bg-surface-container-low flex items-center gap-xs text-on-surface cursor-pointer"
                      onClick={() => onCloneRole(role)}
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span> Clone
                    </button>
                    <button
                      className="w-full text-left px-md py-1.5 text-label-sm hover:bg-surface-container-low flex items-center gap-xs text-on-surface cursor-pointer"
                      onClick={() => onArchiveToggle(role.id)}
                    >
                      <span className="material-symbols-outlined text-[16px]">archive</span> Archive
                    </button>
                    <button
                      className="w-full text-left px-md py-1.5 text-label-sm hover:bg-error-bg text-error-text flex items-center gap-xs cursor-pointer"
                      onClick={() => onInitiateDelete(role)}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
