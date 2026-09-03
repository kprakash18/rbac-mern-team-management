export default function WorkspaceAppTopbar({
  workspace,
  currentUser,
  unreadAnnouncementsCount = 0,
  onAnnouncementsClick,
}) {
  const userName = currentUser?.name || 'Diana Morales';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 bg-surface-container-lowest/90 backdrop-blur-sm border-b border-border-subtle z-30 flex items-center justify-between px-lg shadow-xs shrink-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-xs text-[12px] text-on-surface-variant">
        <span className="font-bold text-on-surface">{workspace?.name || 'Acme Engineering'}</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span>Employee Portal</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-sm">
        {/* Notification Bell */}
        <button
          type="button"
          onClick={onAnnouncementsClick}
          className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadAnnouncementsCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadAnnouncementsCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-xs">
          <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[11px]">
            {initials}
          </div>
          <span className="text-[13px] font-semibold text-on-surface hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
