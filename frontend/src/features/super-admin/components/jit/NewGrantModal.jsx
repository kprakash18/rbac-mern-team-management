import { useState } from 'react';

export default function NewGrantModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    workspace: 'Engineering',
    permission: 'DB_ADMIN',
    targetResource: 'prod-db-cluster-1',
    durationMinutes: 60,
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const initials = formData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const totalSeconds = (parseInt(formData.durationMinutes, 10) || 60) * 60;

    let permBadgeClass = 'bg-primary-container text-on-primary-container border-primary-container';
    if (formData.permission === 'DB_ADMIN') permBadgeClass = 'bg-warning-bg text-warning-text border-warning-bg';
    else if (formData.permission === 'AUDIT_LOG_READ') permBadgeClass = 'bg-surface-variant text-on-surface-variant border-surface-variant';

    onSubmit({
      id: `grant-${Date.now()}`,
      user: {
        name: formData.name,
        email: formData.email,
        initials,
        bgClass: 'bg-primary-container text-on-primary-container',
      },
      workspace: formData.workspace,
      permission: formData.permission,
      permBadgeClass,
      targetResource: formData.targetResource,
      grantedBy: 'Super Admin',
      totalSeconds,
      remainingSeconds: totalSeconds,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-new-grant">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[480px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Issue JIT Access Grant</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Direct time-bound privilege elevation
              </p>
            </div>
          </div>
          <button
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-lg space-y-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              <div>
                <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                  Recipient Full Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                  Recipient Email
                </label>
                <input
                  required
                  type="email"
                  placeholder="j.doe@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              <div>
                <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                  Target Workspace
                </label>
                <select
                  value={formData.workspace}
                  onChange={(e) => setFormData({ ...formData, workspace: e.target.value })}
                  className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Operations">Operations</option>
                  <option value="Security">Security</option>
                  <option value="Finance Secure">Finance Secure</option>
                  <option value="Marketing Global">Marketing Global</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                  Elevated Permission
                </label>
                <select
                  value={formData.permission}
                  onChange={(e) => setFormData({ ...formData, permission: e.target.value })}
                  className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
                >
                  <option value="DB_ADMIN">DB_ADMIN (Database Administrator)</option>
                  <option value="K8S_WRITE">K8S_WRITE (Cluster Write Authority)</option>
                  <option value="AUDIT_LOG_READ">AUDIT_LOG_READ (Security Audit Log)</option>
                  <option value="PROD_DEPLOY">PROD_DEPLOY (Production Release)</option>
                  <option value="USER_INVITE_BATCH">USER_INVITE_BATCH (Member Onboarding)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                Target Resource Identifier
              </label>
              <input
                required
                type="text"
                placeholder="e.g. prod-db-cluster-1 or eks-us-east-2"
                value={formData.targetResource}
                onChange={(e) => setFormData({ ...formData, targetResource: e.target.value })}
                className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface font-mono border border-border-subtle focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                TTL Grant Duration (Minutes)
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value, 10) })}
                className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer font-semibold"
              >
                <option value="15">15 Minutes (Emergency Break-Glass)</option>
                <option value="30">30 Minutes (Quick Incident Fix)</option>
                <option value="60">1 Hour (Standard Sprint Window)</option>
                <option value="120">2 Hours (Maintenance Window)</option>
                <option value="240">4 Hours (Extended Operational Grant)</option>
                <option value="480">8 Hours (Full Shift Elevation)</option>
              </select>
            </div>
          </div>

          <div className="p-md bg-surface-container-low flex justify-end gap-xs border-t border-border-subtle shrink-0">
            <button
              type="button"
              className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-md rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Deploy JIT Grant</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
