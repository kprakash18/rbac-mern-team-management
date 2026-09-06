export default function Avatar({
  name = 'User',
  initials = null,
  isCurrentUser = false,
  size = 'md',
  className = '',
}) {
  const computedInitials =
    initials ||
    name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    'U';

  const sizeStyles = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-[10px]',
    lg: 'w-9 h-9 text-[12px]',
  };

  const chosenSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      title={name}
      className={`rounded-full flex items-center justify-center font-bold shrink-0 transition-transform ${chosenSize} ${
        isCurrentUser
          ? 'bg-primary text-on-primary ring-1 ring-primary'
          : 'bg-surface-container-high text-on-surface'
      } ${className}`}
    >
      {computedInitials}
    </div>
  );
}
