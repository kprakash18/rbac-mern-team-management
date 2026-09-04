export default function WorkspaceListItem({ workspace, onSelect }) {
  const {
    name,
    role,
    icon = 'domain',
    iconBgColor = 'bg-primary',
    iconTextColor = 'text-on-primary',
  } = workspace;

  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(workspace)}
      className="w-full text-left group flex items-center justify-between p-stack-md rounded-lg hover:bg-surface-container-low transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
    >
      <div className="flex items-center gap-stack-md">
        <div
          className={`w-12 h-12 rounded-lg ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            {icon}
          </span>
        </div>
        <div>
          <div className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
            {name}
          </div>
          <div className="font-label-md text-label-md text-on-surface-variant mt-1">
            {role}
          </div>
        </div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
        arrow_forward
      </span>
    </button>
  );
}
