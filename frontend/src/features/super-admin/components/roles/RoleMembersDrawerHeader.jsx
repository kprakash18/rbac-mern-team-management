export default function RoleMembersDrawerHeader({ role, onClose }) {
  return (
    <div className="p-lg bg-surface-container-lowest border-b border-border-subtle flex items-center justify-between shrink-0">
      <div className="flex items-center gap-sm">
        <div
          className={`w-10 h-10 rounded-lg ${role.iconBg || 'bg-surface-container'} flex items-center justify-center text-on-surface shrink-0`}
        >
          <span className="material-symbols-outlined text-[22px]">{role.icon || 'shield_person'}</span>
        </div>
        <div>
          <div className="flex items-center gap-xs">
            <h3 className="font-headline-md text-headline-md text-on-surface">{role.name}</h3>
            {role.type === 'system' ? (
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[10px] font-semibold">
                SYSTEM PRESET
              </span>
            ) : role.status === 'disabled' ? (
              <span className="px-1.5 py-0.5 rounded bg-warning-bg text-warning-text font-label-sm text-[10px] font-semibold border border-warning-text/30">
                DISABLED
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-[10px] font-semibold">
                CUSTOM ROLE
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
            {role.desc || `${role.members} active user assignments`}
          </p>
        </div>
      </div>
      <button
        className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  );
}
