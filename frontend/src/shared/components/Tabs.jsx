export default function Tabs({
  options = [],
  value,
  onChange,
  className = '',
}) {
  return (
    <div
      className={`flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle flex-wrap ${className}`}
    >
      {options.map(({ key, label, count }) => {
        const isSelected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors flex items-center gap-1.5 ${
              isSelected
                ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-surface-container text-on-surface'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
