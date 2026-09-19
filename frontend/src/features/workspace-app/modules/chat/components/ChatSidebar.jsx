import { Avatar, Badge, SearchInput } from '@/shared/components';

function ChatSidebar({
  channels,
  activeChannelId,
  canCreateChannel,
  currentUser,
  isTeamAdmin,
  searchValue,
  onSearchChange,
  onClearSearch,
  onCreateChannel,
  onSelectChannel,
}) {
  return (
    <aside className="w-full md:w-64 bg-surface-container-low border-r border-border-subtle flex flex-col justify-between shrink-0">
      <div>
        <div className="p-3 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">forum</span>
            <h2 className="font-label-bold text-on-surface">Channels</h2>
          </div>
          {canCreateChannel && (
            <button
              type="button"
              onClick={onCreateChannel}
              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer"
              title="Create Channel"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          )}
        </div>

        <div className="p-2 border-b border-border-subtle">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            onClear={onClearSearch}
            placeholder="Search channels..."
            className="w-full"
          />
        </div>

        <div className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-320px)]">
          {channels.map((channel) => {
            const isActive = channel.id === activeChannelId;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isActive ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[15px] font-mono ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>#</span>
                  <span className="text-[13px] truncate">{channel.name}</span>
                </div>
                <Badge variant={isActive ? 'primary' : 'neutral'} size="sm">
                  {(channel.memberIds || []).length}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-border-subtle flex items-center gap-2">
        <Avatar name={currentUser?.name || 'User'} size="sm" />
        <div className="min-w-0 flex-1">
          <span className="text-[12px] font-semibold text-on-surface block truncate">{currentUser?.name}</span>
          <span className="text-[10px] text-on-surface-variant block truncate">{isTeamAdmin ? ' Team Admin' : currentUser?.role}</span>
        </div>
      </div>
    </aside>
  );
}

export default ChatSidebar;
