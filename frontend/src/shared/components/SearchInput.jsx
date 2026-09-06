export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  onClear,
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px] pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:border-primary outline-none transition-colors"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 text-on-surface-variant hover:text-on-surface cursor-pointer p-0.5"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
}
