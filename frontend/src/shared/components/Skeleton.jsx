export function Skeleton({ className = '', variant = 'rectangular', width, height }) {
  const baseClasses = 'animate-pulse bg-surface-container-high dark:bg-surface-container-highest';
  
  const variantClasses = {
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    text: 'rounded h-4 my-1',
    card: 'rounded-xl border border-outline/10',
  }[variant] || 'rounded-lg';

  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return <div className={`${baseClasses} ${variantClasses} ${className}`} style={style} />;
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`p-4 rounded-xl border border-outline/10 bg-surface-container-low space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-1/4 h-3" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`w-full border border-outline/10 rounded-xl overflow-hidden ${className}`}>
      <div className="bg-surface-container-low p-3.5 flex gap-4 border-b border-outline/10">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-outline/10 bg-surface">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3.5 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'w-1/4' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
