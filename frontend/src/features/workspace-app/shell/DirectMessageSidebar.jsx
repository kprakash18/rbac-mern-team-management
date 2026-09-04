import { useState, useRef, useEffect } from 'react';

export default function DirectMessageSidebar({
  targetMember,
  currentUser,
  isOpen,
  isMinimized,
  onClose,
  onToggleMinimize,
}) {
  const currentUserId = currentUser?._id || currentUser?.id || 'current_user';
  const memberId = targetMember?._id || targetMember?.id || 'target_user';

  const [conversationMap, setConversationMap] = useState({});
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const activeMessages = conversationMap[memberId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [isOpen, isMinimized, memberId, conversationMap]);

  if (!isOpen || !targetMember) return null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: 'currentUser',
      text: inputText.trim(),
      timestamp: 'Just now',
    };

    setConversationMap((prev) => ({
      ...prev,
      [memberId]: [...(prev[memberId] || []), newMsg],
    }));

    setInputText('');
  };

  // Minimized Floating Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
        <div
          onClick={onToggleMinimize}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-container-lowest border border-border-subtle shadow-2xl hover:border-primary cursor-pointer transition-all"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[11px]">
              {targetMember.initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
          </div>

          <div className="min-w-0 pr-2">
            <span className="font-label-bold text-[13px] text-on-surface block truncate max-w-35">
              {targetMember.name}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Online • Click to Expand</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Close message panel"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    );
  }

  // Expanded Persistent Right Sidebar
  return (
    <aside className="fixed top-0 right-0 w-full sm:w-95 h-screen bg-surface-container-lowest border-l border-border-subtle shadow-2xl z-50 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-xs">
              {targetMember.initials}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-label-bold text-[14px] text-on-surface font-semibold truncate">
                {targetMember.name}
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-surface-container-high text-on-surface-variant shrink-0">
                {targetMember.teamRole || targetMember.role}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant truncate">{targetMember.email}</p>
          </div>
        </div>

        {/* Controls: Minimize & Close */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Minimize to bottom dock"
          >
            <span className="material-symbols-outlined text-[18px]">minimize</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Close conversation"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-surface-container-low/30">
        <div className="text-center my-1">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider bg-surface-container-high/60 px-2.5 py-0.5 rounded-full">
            Direct Conversation with {targetMember.name}
          </span>
        </div>

        {activeMessages.map((msg) => {
          const isMe = msg.senderId === 'currentUser' || msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${
                  isMe
                    ? 'bg-primary text-on-primary rounded-tr-xs'
                    : 'bg-surface-container-lowest text-on-surface border border-border-subtle rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border-subtle bg-surface-container-lowest shrink-0">
        <div className="flex items-center gap-2 bg-surface-container-low border border-border-subtle rounded-xl px-3 py-1.5 focus-within:border-primary focus-within:bg-surface-container-lowest transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${targetMember.name.split(' ')[0]}...`}
            className="flex-1 bg-transparent text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center justify-center shrink-0"
            title="Send Message (Enter)"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </div>
      </form>
    </aside>
  );
}
