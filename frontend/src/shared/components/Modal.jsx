export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = null,
  maxWidth = 'max-w-md',
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs">
      <div
        className={`bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="p-md border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
            )}
            <div>
              <h3 className="font-headline-md text-[16px] text-on-surface font-semibold leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[12px] text-on-surface-variant mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        {children}
      </div>
    </div>
  );
}
