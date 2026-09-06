export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) {
  const sizeStyles = {
    xs: 'px-1.5 py-0.2 text-[10px] rounded',
    sm: 'px-2 py-0.5 text-[11px] rounded',
    pill: 'px-2.5 py-1 text-[11px] rounded-full',
  };

  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    danger: 'bg-red-50 text-red-700 border-red-200 font-medium',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  };

  const chosenSize = sizeStyles[size] || sizeStyles.sm;
  const chosenVariant = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center justify-center font-medium border text-center transition-colors ${chosenSize} ${chosenVariant} ${className}`}
    >
      {children}
    </span>
  );
}
