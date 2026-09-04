export default function SuperAdminTopbar({ onCreateTeam, onBroadcast, isSidebarOpen = true }) {
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
        <button className="relative p-base hover:bg-surface-container rounded-full transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-on-surface-variant">
            notifications
          </span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
        </button>
        <div className="flex items-center gap-sm cursor-pointer hover:bg-surface-container p-base rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-bold text-label-sm">
            SA
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">
            expand_more
          </span>
        </div>
      </div>
    </header>
  );
}
