import { Avatar, Badge, Button } from '@/shared/components';

function ChatHeader({
  activeChannel,
  activeMembers,
  canInviteMembers,
  canDeleteChannel,
  currentUserId,
  isSocketLive,
  onInvite,
  onDelete,
  onLeave,
}) {
  const memberIds = activeChannel?.memberIds || [];

  return (
    <div className="p-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-container-lowest shrink-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-label-bold text-on-surface font-semibold flex items-center gap-1">
            <span className="font-mono text-on-surface-variant">#</span>
            <span>{activeChannel.name}</span>
          </h3>
          {activeChannel.isDefault && <Badge variant="outline">Default</Badge>}
          <Badge variant={isSocketLive ? 'success' : 'neutral'}>
            {isSocketLive ? 'Live' : 'Connecting...'}
          </Badge>
        </div>
        <p className="text-[12px] text-on-surface-variant truncate mt-0.5">{activeChannel.topic}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center -space-x-1.5 mr-1">
          {activeMembers.slice(0, 4).map((member) => (
            <Avatar key={member.id} name={member.name} size="sm" />
          ))}
        </div>

        {canInviteMembers && (
          <Button size="sm" variant="outline" icon="person_add" onClick={onInvite}>
            Invite
          </Button>
        )}

        {!activeChannel.isDefault && (
          canDeleteChannel ? (
            <Button size="sm" variant="danger" icon="delete" onClick={() => onDelete(activeChannel)}>
              Delete
            </Button>
          ) : (
            memberIds.includes(currentUserId) && (
              <Button size="sm" variant="outline" icon="logout" onClick={() => onLeave(activeChannel)}>
                Leave
              </Button>
            )
          )
        )}
      </div>
    </div>
  );
}

export default ChatHeader;
