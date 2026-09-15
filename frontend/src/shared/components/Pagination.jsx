import Button from './Button';

export default function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  loading = false,
  className = '',
  itemLabel = 'items',
  compact = false,
}) {
  if (totalPages <= 1 && total <= limit) return null;

  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startItem = total > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endItem = total > 0 ? Math.min(currentPage * limit, total) : 0;

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-container-lowest border border-border-subtle rounded-xl text-body-sm text-on-surface-variant ${className}`}
    >
      <div className="text-xs sm:text-sm">
        {total > 0 ? (
          <span>
            Showing <strong className="font-semibold text-on-surface">{startItem.toLocaleString()}</strong> to{' '}
            <strong className="font-semibold text-on-surface">{endItem.toLocaleString()}</strong> of{' '}
            <strong className="font-semibold text-on-surface">{total.toLocaleString()}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-on-surface">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-on-surface">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          className="!px-2.5 !py-1 text-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          title="Previous page"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {!compact && (
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-xs text-on-surface-variant select-none">
                    ...
                  </span>
                );
              }

              const isCurrent = p === currentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  disabled={loading || isCurrent}
                  onClick={() => onPageChange && onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}

        {compact && (
          <span className="text-xs px-2 font-medium text-on-surface">
            {currentPage} / {totalPages}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || loading}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          className="!px-2.5 !py-1 text-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          title="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </Button>
      </div>
    </div>
  );
}
