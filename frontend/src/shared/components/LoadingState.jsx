export default function LoadingState({
  message = 'Loading...',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant ${className}`}
    >
      <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
        progress_activity
      </span>
      <span className="text-[13px] font-medium">{message}</span>
    </div>
  );
}
