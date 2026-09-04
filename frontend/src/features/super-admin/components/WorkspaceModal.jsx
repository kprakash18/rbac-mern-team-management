import { useState, useEffect } from 'react';

const WORKSPACE_ICONS = [
  { id: 'engineering', label: 'Engineering' },
  { id: 'security', label: 'Security' },
  { id: 'campaign', label: 'Marketing' },
  { id: 'payments', label: 'Finance' },
  { id: 'support_agent', label: 'Support' },
  { id: 'science', label: 'Research' },
  { id: 'hub', label: 'Operations' },
  { id: 'cloud', label: 'Infrastructure' },
];

export default function WorkspaceModal({
  isOpen,
  workspace,
  onClose,
  onCreateWorkspace,
  onSaveWorkspace,
  onArchiveWorkspace,
  onRestoreWorkspace,
}) {
  const isEdit = Boolean(workspace);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('engineering');
  const [tier, setTier] = useState('Standard');
  const [adminEmail, setAdminEmail] = useState('');
  const [status, setStatus] = useState('Active');
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || '');
      setSlug(workspace.slug || (workspace.name ? workspace.name.toLowerCase().replace(/\s+/g, '-') : ''));
      setDescription(workspace.description || '');
      setIcon(workspace.icon || 'engineering');
      setTier(workspace.tier || 'Standard');
      setStatus(workspace.status || 'Active');
      setConfirmArchiveOpen(false);
      setError('');
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setIcon('engineering');
      setTier('Standard');
      setAdminEmail('');
      setStatus('Active');
      setConfirmArchiveOpen(false);
      setError('');
    }
  }, [workspace, isOpen]);

  if (!isOpen) return null;

  const isArchived = status === 'Archived';

  const handleNameChange = (val) => {
    setName(val);
    if (!isEdit) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required.');
      return;
    }

    if (isEdit) {
      const updatedWorkspace = {
        ...workspace,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
        description: description.trim(),
        icon,
        tier,
        status,
        updatedAt: new Date().toISOString(),
      };
      if (onSaveWorkspace) onSaveWorkspace(updatedWorkspace);
    } else {
      const newWorkspace = {
        id: `ws-${Date.now()}`,
        name: name.trim(),
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description: description.trim() || 'Custom organizational workspace.',
        icon,
        tier,
        adminEmail: adminEmail.trim(),
        membersCount: 1,
        status: 'Active',
      };
      if (onCreateWorkspace) onCreateWorkspace(newWorkspace);
    }
    onClose();
  };

  const handleArchiveConfirm = () => {
    if (onArchiveWorkspace && workspace) {
      onArchiveWorkspace(workspace.id);
    }
    setConfirmArchiveOpen(false);
    onClose();
  };

  const handleRestoreClick = () => {
    if (onRestoreWorkspace && workspace) {
      onRestoreWorkspace(workspace.id);
    }
    setStatus('Active');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-on-primary-fixed/40 backdrop-blur-sm p-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-lg pb-md border-b border-border-subtle bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                {isEdit ? 'tune' : 'add_business'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {isEdit ? 'Workspace Settings' : 'Create New Workspace'}
                </h2>
                {isEdit && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isArchived
                        ? 'bg-neutral-200 text-neutral-700'
                        : tier === 'Vault Tier' || tier === 'High Security'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {status}
                  </span>
                )}
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                {isEdit
                  ? 'Modify team metadata, security tier, and lifecycle state.'
                  : 'Provision a new isolated team workspace and assign domain policies.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-lg flex flex-col gap-md">
          {error && (
            <div className="p-sm rounded-lg bg-error-container text-error text-label-sm font-label-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Workspace Name */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-sm text-on-surface">
              Workspace Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Security Operations Core"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface font-body-base text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-sm text-on-surface">
              Workspace URL Slug
            </label>
            <div className="flex items-center rounded-lg border border-border-subtle bg-surface-container-low px-3 h-10 text-body-sm font-mono text-on-surface-variant">
              <span>app.acme.corp/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="security-ops-core"
                className="flex-1 bg-transparent text-on-surface outline-none font-mono text-[13px]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-sm text-on-surface">Description</label>
            <textarea
              rows={2}
              placeholder="Describe the objective and operational scope of this workspace..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface font-body-base text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-sm text-on-surface">Workspace Icon</label>
            <div className="grid grid-cols-4 gap-2">
              {WORKSPACE_ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIcon(item.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    icon === item.id
                      ? 'border-primary bg-primary-container/20 text-primary font-bold'
                      : 'border-border-subtle bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{item.id}</span>
                  <span className="text-[11px] font-label-md truncate w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tier Selection */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-sm text-on-surface">Compliance / Security Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface font-body-base text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer"
            >
              <option value="Standard">Standard Tier (Default SOC-2 Scope)</option>
              <option value="High Security">High Security (Enforced JIT Approvals)</option>
              <option value="Vault Tier">Vault Tier (Strict Multi-Party Elevation)</option>
            </select>
          </div>

          {/* Create-only: Initial Team Admin Email */}
          {!isEdit && (
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-sm text-on-surface">
                Designated Team Admin Email
              </label>
              <input
                type="email"
                placeholder="lead@company.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface font-body-base text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
              <span className="text-[11px] text-on-surface-variant">
                Will be automatically provisioned with the Team Admin role upon creation.
              </span>
            </div>
          )}

          {/* Edit-only: Lifecycle Archive Zone */}
          {isEdit && (
            <div className="mt-2 pt-4 border-t border-border-subtle flex flex-col gap-2">
              <label className="font-label-bold text-label-sm text-on-surface">Lifecycle State</label>
              {isArchived ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border-subtle">
                  <div>
                    <div className="font-label-bold text-label-sm text-on-surface">Workspace Archived</div>
                    <div className="text-[12px] text-on-surface-variant">
                      Members cannot access this workspace while archived.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreClick}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-bold text-label-sm hover:bg-primary-container transition-colors cursor-pointer"
                  >
                    Restore Workspace
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-error-container/20 border border-error-container/40">
                  <div>
                    <div className="font-label-bold text-label-sm text-error">Archive Workspace</div>
                    <div className="text-[12px] text-on-surface-variant">
                      Suspend all member access without deleting historical audit logs.
                    </div>
                  </div>
                  {!confirmArchiveOpen ? (
                    <button
                      type="button"
                      onClick={() => setConfirmArchiveOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10 font-label-bold text-label-sm transition-colors cursor-pointer"
                    >
                      Archive...
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleArchiveConfirm}
                        className="px-3 py-1.5 rounded-lg bg-error text-on-error font-label-bold text-label-sm hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Confirm Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmArchiveOpen(false)}
                        className="px-2 py-1.5 text-on-surface-variant hover:text-on-surface text-label-sm cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-md border-t border-border-subtle mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container font-label-bold text-label-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-bold text-label-sm transition-colors shadow-sm cursor-pointer"
            >
              {isEdit ? 'Save Changes' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
