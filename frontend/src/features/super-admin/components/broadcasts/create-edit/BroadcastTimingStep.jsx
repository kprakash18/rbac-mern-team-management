function BroadcastTimingStep({ formData, updateForm }) {
  return (
    <div className="space-y-md animate-in fade-in duration-150">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <div>
          <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
            Publication Trigger
          </label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-xs text-[12px] font-medium text-on-surface cursor-pointer">
              <input
                type="radio"
                name="startTiming"
                checked={formData.startTiming === 'NOW'}
                onChange={() => updateForm({ startTiming: 'NOW' })}
              />
              <span>Publish immediately upon submit</span>
            </label>
            <label className="flex items-center gap-xs text-[12px] font-medium text-on-surface cursor-pointer">
              <input
                type="radio"
                name="startTiming"
                checked={formData.startTiming === 'SCHEDULED'}
                onChange={() => updateForm({ startTiming: 'SCHEDULED' })}
              />
              <span>Schedule for future maintenance window</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
            Acknowledgment Mode
          </label>
          <select
            value={formData.ackMode}
            onChange={(event) => updateForm({ ackMode: event.target.value })}
            className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer font-semibold"
          >
            <option value="NONE">Informative Only (Passive dismiss)</option>
            <option value="READ_RECEIPT">Read Receipt Tracking</option>
            <option value="MANDATORY_ACK">Mandatory Electronic Signature (SOC2)</option>
          </select>
        </div>
      </div>

      <div className="p-sm bg-surface-container-low rounded-lg text-[11px] text-on-surface-variant flex items-center gap-sm">
        <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
        <span>
          Compliance Note: All acknowledgments are cryptographically hashed and logged with User ID, IP address, and timestamp for audit.
        </span>
      </div>
    </div>
  );
}

export default BroadcastTimingStep;
