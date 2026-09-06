export default function ConfirmModal({
  isOpen,
  title,
  description,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  icon = 'warning',
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      btn: 'bg-error text-on-error hover:opacity-90',
      iconContainer: 'bg-error-container/60 text-error',
    },
    warning: {
      btn: 'bg-warning-text text-white hover:opacity-90',
      iconContainer: 'bg-warning-bg text-warning-text',
    },
    primary: {
      btn: 'bg-primary text-on-primary hover:opacity-90',
      iconContainer: 'bg-primary/10 text-primary',
    },
  };

  const style = variantStyles[confirmVariant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-2xl p-lg flex flex-col gap-md border border-border-subtle animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-md">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.iconContainer}`}>
            <span className="material-symbols-outlined text-[24px]">{icon}</span>
          </div>
          <div className="flex flex-col gap-xs flex-1 min-w-0">
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {title}
            </h3>
            {description && (
              <div className="font-body-base text-body-base text-on-surface-variant text-[13px] leading-relaxed">
                {description}
              </div>
            )}
            {children && <div className="mt-1">{children}</div>}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold cursor-pointer transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-md py-1.5 rounded-lg text-label-sm font-label-bold cursor-pointer transition-opacity shadow-sm ${style.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
