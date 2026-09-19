import { Avatar, Button, SanitizedText } from '@/shared/components';

function SystemBroadcastMessage({ message }) {
  return (
    <div className="w-full my-2 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex items-start gap-3">
      <span className="material-symbols-outlined text-[20px] text-amber-950">campaign</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
            SYSTEM BROADCAST
          </span>
          <span className="text-[11px] text-amber-800 font-mono">{message.timestamp}</span>
        </div>
        <p className="text-[14px] font-bold text-amber-950">
          <SanitizedText text={message.text} />
        </p>
      </div>
    </div>
  );
}

function MessageActions({ isMine, message, onDelete, onStartEdit }) {
  return (
    <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity bg-surface-container-lowest border border-border-subtle rounded-lg shadow-sm flex items-center p-0.5 gap-0.5 z-10 ${isMine ? 'right-full mr-1.5' : 'left-full ml-1.5'}`}>
      {isMine && (
        <button
          type="button"
          onClick={() => onStartEdit(message)}
          className="p-1 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[15px]">edit</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(message)}
        className="p-1 text-on-surface-variant hover:text-error"
      >
        <span className="material-symbols-outlined text-[15px]">delete</span>
      </button>
    </div>
  );
}

function EditableMessage({ editingText, onCancel, onSave, onTextChange }) {
  return (
    <div className="w-full min-w-70 p-2.5 rounded-xl bg-surface-container-lowest border-2 border-primary shadow-md flex flex-col gap-2">
      <textarea
        value={editingText}
        onChange={onTextChange}
        rows={2}
        className="w-full bg-transparent text-[13px] text-on-surface outline-none resize-none"
        autoFocus
      />
      <div className="flex items-center justify-end gap-1.5">
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onSave}>Save</Button>
      </div>
    </div>
  );
}

function ChatMessage({
  canModerate,
  currentUserId,
  editingMessageId,
  editingText,
  message,
  onCancelEdit,
  onDelete,
  onEditingTextChange,
  onSaveEdit,
  onStartEdit,
}) {
  const isMine = message.senderId === currentUserId;
  const isEditing = editingMessageId === message.id;

  if (message.isSystemBroadcast) return <SystemBroadcastMessage message={message} />;

  return (
    <div className={`relative group/msg flex items-start gap-2.5 max-w-2xl ${isMine ? 'self-end flex-row-reverse' : 'self-start'}`}>
      <Avatar name={message.senderName} size="sm" />
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-lg`}>
        <div className="flex items-center gap-1.5 mb-1 text-[12px]">
          <span className="font-label-bold text-on-surface">{message.senderName}</span>
          <span className="text-[10px] text-on-surface-variant font-mono">{message.timestamp}</span>
          {message.isEdited && <span className="text-[10px] text-on-surface-variant/70 italic">(edited)</span>}
        </div>

        {isEditing ? (
          <EditableMessage
            editingText={editingText}
            onCancel={onCancelEdit}
            onSave={() => onSaveEdit(message.id)}
            onTextChange={onEditingTextChange}
          />
        ) : (
          <div className="relative">
            <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${isMine ? 'bg-primary text-on-primary rounded-tr-xs' : 'bg-surface-container-low text-on-surface border border-border-subtle rounded-tl-xs'}`}>
              <SanitizedText text={message.text} />
            </div>

            {(isMine || canModerate) && (
              <MessageActions
                isMine={isMine}
                message={message}
                onDelete={onDelete}
                onStartEdit={onStartEdit}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessageList({
  canModerate,
  currentUserId,
  editingMessageId,
  editingText,
  messages,
  messagesEndRef,
  onCancelEdit,
  onDelete,
  onEditingTextChange,
  onSaveEdit,
  onStartEdit,
}) {
  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          canModerate={canModerate}
          currentUserId={currentUserId}
          editingMessageId={editingMessageId}
          editingText={editingText}
          message={message}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
          onEditingTextChange={onEditingTextChange}
          onSaveEdit={onSaveEdit}
          onStartEdit={onStartEdit}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessageList;
