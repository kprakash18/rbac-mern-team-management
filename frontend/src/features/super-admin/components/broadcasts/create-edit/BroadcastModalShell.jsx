const STEPS = [
  { step: 1, label: '1. Basic Details' },
  { step: 2, label: '2. Audience Scope' },
  { step: 3, label: '3. Timing & Acks' },
  { step: 4, label: '4. Live Preview' },
];

function BroadcastModalShell({
  activeStep,
  broadcastToEdit,
  children,
  onClose,
  onStepChange,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-create-broadcast">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[720px] max-w-[96vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto max-h-[92vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">campaign</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {broadcastToEdit ? 'Edit System Broadcast' : 'Deploy System Broadcast'}
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Platform-wide governance notice &amp; fleet alerting
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

        <div className="flex border-b border-border-subtle bg-surface-container-low px-lg py-xs gap-sm text-[12px] font-label-bold overflow-x-auto">
          {STEPS.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => onStepChange(item.step)}
              className={`px-sm py-1 rounded-lg transition-colors cursor-pointer ${
                activeStep === item.step
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}

export default BroadcastModalShell;
