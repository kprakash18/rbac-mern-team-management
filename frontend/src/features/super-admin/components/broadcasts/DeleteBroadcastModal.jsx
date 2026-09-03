export default function DeleteBroadcastModal({
  isOpen,
  broadcast,
  isEndEarlyMode,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !broadcast) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-md" id="modal-delete-broadcast">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[440px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1210] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-error-bg text-error-text flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">
                {isEndEarlyMode ? 'stop_circle' : 'delete_forever'}
              </span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {isEndEarlyMode ? 'End Broadcast Early?' : 'Delete Broadcast?'}
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                {isEndEarlyMode ? 'Deactivate active client banners' : 'Remove broadcast record'}
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

        <div className="p-lg space-y-md text-body-sm text-on-surface">
          <p>
            Are you sure you want to {isEndEarlyMode ? 'end the broadcast early for' : 'permanently delete'}{' '}
            <strong>"{broadcast.title}"</strong>?
          </p>
          <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant space-y-1">
            <div><strong>Type:</strong> {broadcast.type}</div>
            <div><strong>Target Scope:</strong> {broadcast.scope}</div>
            <div><strong>Active Reach:</strong> {broadcast.metrics?.targetedUsers} targeted users</div>
          </div>
        </div>

        <div className="p-md bg-surface-container-low flex justify-end gap-xs border-t border-border-subtle shrink-0">
          <button
            type="button"
            className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-9 px-md rounded-lg bg-error-text text-on-error hover:opacity-90 font-label-bold text-label-sm transition-colors cursor-pointer flex items-center gap-1"
            onClick={() => {
              onConfirm(broadcast.id);
              onClose();
            }}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isEndEarlyMode ? 'stop' : 'delete'}
            </span>
            <span>{isEndEarlyMode ? 'Confirm End Early' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
