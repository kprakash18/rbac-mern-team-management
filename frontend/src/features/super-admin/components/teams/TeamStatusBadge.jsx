export default function TeamStatusBadge({ status, size = 'md' }) {
  const archived = status === 'Archived';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';

  if (archived) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant ${textSize} font-bold shadow-2xs shrink-0`}>
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant mr-1.5 shrink-0"></span>
        Archived
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full bg-success-bg text-success-text ${textSize} font-bold shadow-2xs shrink-0`}>
      <span className="w-1.5 h-1.5 rounded-full bg-success-text mr-1.5 shrink-0"></span>
      Active
    </span>
  );
}
