export default function RouteLoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-primary text-[36px]">
          progress_activity
        </span>
        <span className="text-[13px] font-medium tracking-wide">Loading workspace...</span>
      </div>
    </div>
  );
}
