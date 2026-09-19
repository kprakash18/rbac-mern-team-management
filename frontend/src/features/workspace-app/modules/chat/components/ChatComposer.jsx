import { Button } from '@/shared/components';

function ChatComposer({
  canBroadcast,
  channelName,
  inputText,
  isBroadcastMode,
  onChange,
  onSubmit,
  onToggleBroadcast,
}) {
  return (
    <form onSubmit={onSubmit} className="p-3 border-t border-border-subtle bg-surface-container-lowest shrink-0">
      <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border ${isBroadcastMode ? 'bg-amber-50 border-amber-400' : 'bg-surface-container-low border-border-subtle'}`}>
        <input
          type="text"
          value={inputText}
          onChange={onChange}
          placeholder={isBroadcastMode ? 'Type system broadcast...' : `Message #${channelName}...`}
          className="flex-1 bg-transparent text-[13px] text-on-surface outline-none"
        />

        {canBroadcast && (
          <button
            type="button"
            onClick={onToggleBroadcast}
            className={`p-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1 cursor-pointer ${isBroadcastMode ? 'bg-amber-300 text-amber-950' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
          </button>
        )}

        <Button size="sm" type="submit" disabled={!inputText.trim()} icon="send" />
      </div>
    </form>
  );
}

export default ChatComposer;
