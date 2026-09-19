import { BROADCAST_TYPES } from '@/constants';

function BroadcastBasicStep({ formData, updateForm }) {
  return (
    <div className="space-y-md animate-in fade-in duration-150">
      <div>
        <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
          Broadcast Type Archetype
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs">
          {Object.values(BROADCAST_TYPES).map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => updateForm({ type: type.id, severity: type.defaultSeverity })}
              className={`p-sm rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                formData.type === type.id
                  ? 'border-primary bg-primary-fixed/20 shadow-xs'
                  : 'border-border-subtle hover:bg-surface-container-low'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${type.colorClass.split(' ')[0]}`}>
                {type.icon}
              </span>
              <span className="font-label-bold text-[12px] text-on-surface">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
          Broadcast Headline Title *
        </label>
        <input
          required
          type="text"
          placeholder="e.g. Emergency Database Failover or Planned Maintenance"
          value={formData.title}
          onChange={(event) => updateForm({ title: event.target.value })}
          className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
          Announcement Message Body *
        </label>
        <textarea
          required
          rows="3"
          placeholder="Explain the incident, maintenance window, or compliance policy in detail..."
          value={formData.message}
          onChange={(event) => updateForm({ message: event.target.value })}
          className="w-full p-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <div>
          <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
            Optional Action Button Label
          </label>
          <input
            type="text"
            placeholder="e.g. Live Status Page ->"
            value={formData.ctaLabel}
            onChange={(event) => updateForm({ ctaLabel: event.target.value })}
            className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
            Action Button Target URL
          </label>
          <input
            type="text"
            placeholder="https://status.company.com or #jit-access"
            value={formData.ctaUrl}
            onChange={(event) => updateForm({ ctaUrl: event.target.value })}
            className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

export default BroadcastBasicStep;
