import { useState, useEffect } from 'react';

export default function TeamSettingsModal({ isOpen, workspace, onClose, onSave }) {
  const [teamName, setTeamName] = useState(workspace?.name || 'Acme Engineering');
  const [description, setDescription] = useState(
    workspace?.description || 'Core engineering team building enterprise cloud microservices.'
  );
  const [department, setDepartment] = useState(workspace?.department || 'Engineering');
  const [region, setRegion] = useState(workspace?.region || 'US-East-1 (Primary Cluster)');
  const [maxLeaseDuration, setMaxLeaseDuration] = useState(workspace?.maxLeaseDuration || '8h');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (workspace) {
      setTeamName(workspace.name || 'Acme Engineering');
      setDescription(workspace.description || '');
      setDepartment(workspace.department || 'Engineering');
      setRegion(workspace.region || 'US-East-1 (Primary Cluster)');
      setMaxLeaseDuration(workspace.maxLeaseDuration || '8h');
    }
  }, [workspace]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsSaving(true);
    const updated = {
      ...workspace,
      name: teamName.trim(),
      description: description.trim(),
      department,
      region,
      maxLeaseDuration,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl p-lg flex flex-col gap-md border border-border-subtle animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-sm border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <h3 className="font-headline-md text-[16px] font-bold text-on-surface">
                Team Workspace Settings
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                Configure team identity, infrastructure defaults, and governance policies.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Team Workspace Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
              placeholder="e.g. Acme Engineering"
            />
          </div>

          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Description &amp; Mission
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
              placeholder="Brief description of the team's scope..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                Department Focus
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="Engineering">Engineering Core</option>
                <option value="Platform">Platform &amp; Infrastructure</option>
                <option value="Security">Security &amp; Compliance</option>
                <option value="Product">Product &amp; Operations</option>
              </select>
            </div>

            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                Primary Cluster Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="US-East-1 (Primary Cluster)">US-East-1 (Virginia)</option>
                <option value="US-West-2 (Oregon)">US-West-2 (Oregon)</option>
                <option value="EU-Central-1 (Frankfurt)">EU-Central-1 (Frankfurt)</option>
                <option value="AP-Southeast-1 (Singapore)">AP-Southeast-1 (Singapore)</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-2">
            <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-600">shield</span>
              <span>Team Governance Policy</span>
            </span>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-on-surface-variant">Maximum JIT Elevation Lease:</span>
              <select
                value={maxLeaseDuration}
                onChange={(e) => setMaxLeaseDuration(e.target.value)}
                className="px-2 py-1 bg-surface-container-lowest border border-border-subtle rounded-md text-[11px] font-semibold text-on-surface outline-none cursor-pointer"
              >
                <option value="2h">2 hours</option>
                <option value="4h">4 hours</option>
                <option value="8h">8 hours (Standard)</option>
                <option value="24h">24 hours (Extended)</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !teamName.trim()}
              className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold cursor-pointer transition-opacity shadow-sm disabled:opacity-50"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
