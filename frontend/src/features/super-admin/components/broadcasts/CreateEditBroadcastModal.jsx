import { useState, useEffect } from 'react';
import { BROADCAST_TYPES } from '@/constants';

export default function CreateEditBroadcastModal({
  isOpen,
  broadcastToEdit,
  onClose,
  onSubmit,
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'OUTAGE',
    severity: 'P0 Critical Outage',
    scope: 'GLOBAL',
    targetWorkspaces: ['All Workspaces (18 active)'],
    targetRoles: ['All Roles'],
    ackMode: 'READ_RECEIPT',
    ctaLabel: '',
    ctaUrl: '',
    startTiming: 'NOW',
    scheduledDate: '2026-10-30T00:00',
    endTiming: 'DISMISSED',
    expireDate: '2026-11-05T23:59',
  });

  useEffect(() => {
    if (isOpen) {
      setActiveStep(1);
      if (broadcastToEdit) {
        setFormData({
          title: broadcastToEdit.title || '',
          message: broadcastToEdit.message || broadcastToEdit.body || '',
          type: broadcastToEdit.type || 'OUTAGE',
          severity: broadcastToEdit.severity || 'P0 Critical Outage',
          scope: broadcastToEdit.scope || 'GLOBAL',
          targetWorkspaces: broadcastToEdit.targetWorkspaces?.length ? broadcastToEdit.targetWorkspaces : ['All Workspaces (18 active)'],
          targetRoles: broadcastToEdit.targetRoles?.length ? broadcastToEdit.targetRoles : ['All Roles'],
          ackMode: broadcastToEdit.ackMode || 'READ_RECEIPT',
          ctaLabel: broadcastToEdit.cta?.label || '',
          ctaUrl: broadcastToEdit.cta?.url || '',
          startTiming: broadcastToEdit.status === 'SCHEDULED' ? 'SCHEDULED' : 'NOW',
          scheduledDate: broadcastToEdit.startsAt ? new Date(broadcastToEdit.startsAt).toISOString().slice(0, 16) : '2026-10-30T00:00',
          endTiming: broadcastToEdit.expiresAt ? 'DATE' : 'DISMISSED',
          expireDate: broadcastToEdit.expiresAt ? new Date(broadcastToEdit.expiresAt).toISOString().slice(0, 16) : '2026-11-05T23:59',
        });
      } else {
        setFormData({
          title: '',
          message: '',
          type: 'OUTAGE',
          severity: 'P0 Critical Outage',
          scope: 'GLOBAL',
          targetWorkspaces: ['All Workspaces (18 active)'],
          targetRoles: ['All Roles'],
          ackMode: 'READ_RECEIPT',
          ctaLabel: '',
          ctaUrl: '',
          startTiming: 'NOW',
          scheduledDate: '2026-10-30T00:00',
          endTiming: 'DISMISSED',
          expireDate: '2026-11-05T23:59',
        });
      }
    }
  }, [isOpen, broadcastToEdit]);


  if (!isOpen) return null;

  const currentTypeConfig = BROADCAST_TYPES[formData.type] || BROADCAST_TYPES.OUTAGE;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) return;

    const newBroadcast = {
      id: broadcastToEdit?.id || `bc-${Date.now()}`,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      status: formData.startTiming === 'SCHEDULED' ? 'SCHEDULED' : 'ACTIVE',
      severity: formData.severity,
      scope: formData.scope,
      targetWorkspaces:
        formData.scope === 'GLOBAL'
          ? ['All Workspaces (18 active)']
          : formData.targetWorkspaces.filter((w) => typeof w === 'string' && !w.includes('All Workspaces')),
      targetRoles:
        formData.scope === 'ROLE_SCOPED'
          ? formData.targetRoles.filter((r) => typeof r === 'string' && !r.includes('All Roles'))
          : ['All Roles'],
      ackMode: formData.ackMode,
      cta: formData.ctaLabel ? { label: formData.ctaLabel, url: formData.ctaUrl } : null,
      metrics: broadcastToEdit?.metrics || {
        targetedUsers: formData.scope === 'GLOBAL' ? 1240 : 320,
        viewedCount: 0,
        acknowledgedCount: 0,
      },
      workspaceBreakdown: broadcastToEdit?.workspaceBreakdown || [
        { workspace: 'Engineering Core', targeted: 180, viewed: 0, acknowledged: 0 },
        { workspace: 'Operations & SRE', targeted: 80, viewed: 0, acknowledged: 0 },
        { workspace: 'Finance Secure', targeted: 60, viewed: 0, acknowledged: 0 },
      ],
      roleBreakdown: broadcastToEdit?.roleBreakdown || [],
      recentAcks: [],
      startAt: formData.startTiming === 'SCHEDULED' ? formData.scheduledDate : new Date().toISOString(),
      endAt: formData.endTiming === 'DATE' ? formData.expireDate : null,
      createdAt: 'Just now',
      createdBy: 'Super Admin',
      timeLabel: formData.startTiming === 'SCHEDULED' ? `Scheduled for ${formData.scheduledDate.replace('T', ' ')}` : 'Live • Just published',
      stickyNotice: formData.ackMode === 'MANDATORY_ACK' ? 'Requires mandatory electronic acknowledgment' : 'Active banner',
    };

    onSubmit(newBroadcast);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-create-broadcast">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[720px] max-w-[96vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">campaign</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {broadcastToEdit ? 'Edit System Broadcast' : 'Deploy System Broadcast'}
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Platform-wide governance notice &amp; fleet alerting
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

        {/* Wizard Step Navigation */}
        <div className="flex border-b border-border-subtle bg-surface-container-low px-lg py-xs gap-sm text-[12px] font-label-bold overflow-x-auto">
          {[
            { step: 1, label: '1. Basic Details' },
            { step: 2, label: '2. Audience Scope' },
            { step: 3, label: '3. Timing & Acks' },
            { step: 4, label: '4. Live Preview' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step)}
              className={`px-sm py-1 rounded-lg transition-colors cursor-pointer ${
                activeStep === item.step
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-lg space-y-md overflow-y-auto flex-1">
            {/* Step 1: Basic Details */}
            {activeStep === 1 && (
              <div className="space-y-md animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                    Broadcast Type Archetype
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs">
                    {Object.values(BROADCAST_TYPES).map((bt) => (
                      <button
                        key={bt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: bt.id, severity: bt.defaultSeverity })}
                        className={`p-sm rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          formData.type === bt.id
                            ? 'border-primary bg-primary-fixed/20 shadow-xs'
                            : 'border-border-subtle hover:bg-surface-container-low'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[20px] ${bt.colorClass.split(' ')[0]}`}>
                          {bt.icon}
                        </span>
                        <span className="font-label-bold text-[12px] text-on-surface">{bt.label}</span>
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
                      placeholder="e.g. Live Status Page →"
                      value={formData.ctaLabel}
                      onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                      className="w-full h-9 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Audience Scope */}
            {activeStep === 2 && (
              <div className="space-y-md animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                    Delivery Scope Boundary
                  </label>
                  <div className="grid grid-cols-3 gap-xs">
                    {[
                      { id: 'GLOBAL', label: 'Global Fleet', desc: 'All 18 workspaces (1,240 users)', icon: 'public' },
                      { id: 'WORKSPACE_SCOPED', label: 'Workspace Scoped', desc: 'Selected tenant groups', icon: 'corporate_fare' },
                      { id: 'ROLE_SCOPED', label: 'Role Scoped', desc: 'Specific privilege tiers', icon: 'shield_person' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          let updatedWorkspaces = formData.targetWorkspaces;
                          let updatedRoles = formData.targetRoles;
                          if (item.id === 'WORKSPACE_SCOPED') {
                            updatedWorkspaces = formData.targetWorkspaces.filter((w) => typeof w === 'string' && !w.includes('All Workspaces'));
                            if (updatedWorkspaces.length === 0) {
                              updatedWorkspaces = ['Engineering Core'];
                            }
                          } else if (item.id === 'ROLE_SCOPED') {
                            updatedRoles = formData.targetRoles.filter((r) => typeof r === 'string' && !r.includes('All Roles'));
                            if (updatedRoles.length === 0) {
                              updatedRoles = ['Workspace Admin'];
                            }
                          } else {
                            updatedWorkspaces = ['All Workspaces (18 active)'];
                            updatedRoles = ['All Roles'];
                          }
                          setFormData({
                            ...formData,
                            scope: item.id,
                            targetWorkspaces: updatedWorkspaces,
                            targetRoles: updatedRoles,
                          });
                        }}
                        className={`p-sm rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          formData.scope === item.id
                            ? 'border-primary bg-primary-fixed/20 shadow-xs'
                            : 'border-border-subtle hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] text-primary">{item.icon}</span>
                        <span className="font-label-bold text-[12px] text-on-surface">{item.label}</span>
                        <span className="text-[11px] text-on-surface-variant">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.scope === 'WORKSPACE_SCOPED' && (
                  <div>
                    <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                      Targeted Workspaces (Multi-Select)
                    </label>
                    <div className="p-sm bg-surface-container-low rounded-lg space-y-1.5 max-h-40 overflow-y-auto">
                      {[
                        'Engineering Core',
                        'Product & Design',
                        'DevOps & Cloud Infra',
                        'Security & Compliance',
                        'Data & AI Platform',
                        'Research & AI Lab',
                        'Customer Operations',
                        'Legacy Billing Gateway',
                      ].map((ws) => (
                        <label key={ws} className="flex items-center gap-sm text-[12px] font-medium text-on-surface cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.targetWorkspaces.includes(ws)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, targetWorkspaces: [...formData.targetWorkspaces.filter((w) => !w.includes('All Workspaces')), ws] });
                              } else {
                                setFormData({ ...formData, targetWorkspaces: formData.targetWorkspaces.filter((w) => w !== ws) });
                              }
                            }}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span>{ws}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.scope === 'ROLE_SCOPED' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-label-bold text-on-surface-variant">
                        Targeted Privilege Roles (Multi-Select)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allRoles = [
                            'Workspace Admin',
                            'Lead Architect',
                            'DevOps Engineer',
                            'Compliance Officer',
                            'Billing Manager',
                            'Team Member / Developer',
                            'Read-Only Auditor',
                          ];
                          const isAllSelected = formData.targetRoles.length === allRoles.length;
                          setFormData({
                            ...formData,
                            targetRoles: isAllSelected ? ['Workspace Admin'] : allRoles,
                          });
                        }}
                        className="text-[11px] text-primary underline font-medium cursor-pointer"
                      >
                        {formData.targetRoles.length === 7 ? 'Deselect All' : 'Select All Roles'}
                      </button>
                    </div>
                    <div className="p-sm bg-surface-container-low rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-border-subtle">
                      {[
                        'Workspace Admin',
                        'Lead Architect',
                        'DevOps Engineer',
                        'Compliance Officer',
                        'Billing Manager',
                        'Team Member / Developer',
                        'Read-Only Auditor',
                      ].map((role) => (
                        <label key={role} className="flex items-center gap-sm text-[12px] font-medium text-on-surface cursor-pointer p-1 rounded hover:bg-surface-container">
                          <input
                            type="checkbox"
                            checked={formData.targetRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, targetRoles: [...formData.targetRoles, role] });
                              } else {
                                setFormData({ ...formData, targetRoles: formData.targetRoles.filter((r) => r !== role) });
                              }
                            }}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                  <span>
                    Estimated Reach:{' '}
                    <strong>
                      {formData.scope === 'GLOBAL'
                        ? '~1,240 users across 18 workspaces'
                        : formData.scope === 'ROLE_SCOPED'
                        ? `~${Math.max(1, formData.targetRoles.length * 35)} users across ${formData.targetRoles.length} selected role(s)`
                        : `~${Math.max(1, formData.targetWorkspaces.length * 45)} users across ${formData.targetWorkspaces.length} selected workspace(s)`}
                    </strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Timing & Lifespan */}
            {activeStep === 3 && (
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
                          onChange={() => setFormData({ ...formData, startTiming: 'NOW' })}
                        />
                        <span>Publish immediately upon submit</span>
                      </label>
                      <label className="flex items-center gap-xs text-[12px] font-medium text-on-surface cursor-pointer">
                        <input
                          type="radio"
                          name="startTiming"
                          checked={formData.startTiming === 'SCHEDULED'}
                          onChange={() => setFormData({ ...formData, startTiming: 'SCHEDULED' })}
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
                      onChange={(e) => setFormData({ ...formData, ackMode: e.target.value })}
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
            )}

            {/* Step 4: Live Banner Preview */}
            {activeStep === 4 && (
              <div className="space-y-md animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-label-bold text-on-surface-variant mb-1">
                    Live Client-Facing Sticky Banner Preview
                  </label>
                  <div className={`p-md rounded-xl shadow-sm flex items-center justify-between gap-sm border ${currentTypeConfig.badgeClass}`}>
                    <div className="flex items-center gap-sm min-w-0">
                      <span className="material-symbols-outlined text-[20px] shrink-0">
                        {currentTypeConfig.icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-bold text-[13px] text-on-surface truncate">
                          {formData.title || 'Broadcast Title'}
                        </span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                          {formData.message || 'Announcement message preview...'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-xs shrink-0">
                      {formData.ctaLabel && (
                        <span className="px-sm py-0.5 rounded text-[11px] font-bold underline cursor-pointer">
                          {formData.ctaLabel}
                        </span>
                      )}
                      <button
                        type="button"
                        className="px-sm py-1 rounded-lg bg-primary text-on-primary text-[11px] font-label-bold"
                      >
                        {formData.ackMode === 'MANDATORY_ACK' ? 'Acknowledge' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-md bg-surface-container-low rounded-lg text-[12px] space-y-1">
                  <div><strong>Type:</strong> {currentTypeConfig.label} ({formData.severity})</div>
                  <div>
                    <strong>Audience:</strong> {formData.scope === 'GLOBAL' ? 'Global Fleet (All 18 workspaces)' : formData.scope === 'ROLE_SCOPED' ? `Roles (${formData.targetRoles.join(', ')})` : `Workspaces (${formData.targetWorkspaces.join(', ')})`}
                  </div>
                  <div><strong>Mode:</strong> {formData.ackMode}</div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-md bg-surface-container-low flex justify-between items-center border-t border-border-subtle shrink-0">
            {activeStep > 1 ? (
              <button
                type="button"
                className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
                onClick={() => setActiveStep((prev) => prev - 1)}
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
                onClick={onClose}
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-xs">
              {activeStep < 4 ? (
                <button
                  type="button"
                  className="h-9 px-lg rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs"
                  onClick={() => setActiveStep((prev) => prev + 1)}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="h-9 px-lg rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  <span>{broadcastToEdit ? 'Save Changes' : 'Publish Broadcast'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
