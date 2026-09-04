export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const typeConfig = {
    success: {
      container: 'bg-success-bg text-success-text border-success-text/30',
      icon: 'check_circle',
      closeBtn: 'hover:bg-success-text/10',
    },
    error: {
      container: 'bg-error-container/30 text-error border-error/30',
      icon: 'error',
      closeBtn: 'hover:bg-error/10',
    },
    info: {
      container: 'bg-primary-container text-on-primary-container border-primary/20',
      icon: 'info',
      closeBtn: 'hover:bg-primary/10',
    },
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div
      className={`p-sm px-md rounded-lg border font-label-bold text-label-sm flex items-center justify-between animate-in fade-in duration-200 ${config.container}`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded cursor-pointer transition-colors ${config.closeBtn}`}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
}
