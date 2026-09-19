function ManageUserConfirmModal({ confirmModal, onClose }) {
  if (!confirmModal) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-xs p-md animate-in fade-in duration-150">
      <div className="w-full max-w-110 bg-surface-container-lowest rounded-xl shadow-2xl p-lg flex flex-col gap-md border border-border-subtle animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-md">
          <div className="w-10 h-10 rounded-full bg-error-container/60 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              {confirmModal.icon || 'warning'}
            </span>
          </div>
          <div className="flex flex-col gap-xs flex-1">
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {confirmModal.title}
            </h3>
            <p className="font-body-base text-body-base text-on-surface-variant leading-relaxed">
              {confirmModal.message}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-sm mt-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-sm rounded-lg border border-border-subtle bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold text-label-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmModal.onConfirm}
            className={`px-md py-sm rounded-lg font-label-bold text-label-sm shadow-sm transition-all cursor-pointer ${
              confirmModal.confirmButtonClass || 'bg-error text-on-error'
            }`}
          >
            {confirmModal.confirmButtonText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageUserConfirmModal;
