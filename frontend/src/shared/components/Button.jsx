export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  isLoading = false,
  loadingText = null,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  title,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-label-bold transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    xs: 'px-2 py-1 text-[11px] rounded-md gap-1',
    sm: 'px-2.5 py-1 text-[12px] rounded-md gap-1.5',
    md: 'px-md py-2 text-label-sm rounded-lg gap-2 shadow-sm',
    lg: 'px-5 py-2.5 text-[14px] rounded-lg gap-2 shadow-sm',
  };

  const variantStyles = {
    primary:
      'bg-primary text-on-primary hover:opacity-90 active:opacity-95',
    secondary:
      'border border-border-subtle bg-surface-container-lowest text-on-surface hover:bg-surface-container active:bg-surface-container-high',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 border border-red-200',
    dangerSolid:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
    ghost:
      'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
  };

  const chosenSize = sizeStyles[size] || sizeStyles.md;
  const chosenVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      title={title}
      className={`${baseStyles} ${chosenSize} ${chosenVariant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="material-symbols-outlined text-[16px] animate-spin">
            progress_activity
          </span>
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        <>
          {icon && (
            <span className="material-symbols-outlined text-[18px] shrink-0">
              {icon}
            </span>
          )}
          {children}
        </>
      )}
    </button>
  );
}
