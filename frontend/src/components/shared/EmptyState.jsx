export default function EmptyState({
  icon = 'inbox',
  title = 'No items found',
  message,
  actionText,
  onAction,
}) {
  return (
    <div className="py-12 px-4 text-center text-on-surface-variant flex flex-col items-center justify-center">
      <span className="material-symbols-outlined text-[40px] block mb-2 text-on-surface-variant/40">
        {icon}
      </span>
      <h4 className="font-label-bold text-[14px] text-on-surface mb-0.5">{title}</h4>
      {message && <p className="text-[12px] text-on-surface-variant max-w-sm">{message}</p>}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity cursor-pointer shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
