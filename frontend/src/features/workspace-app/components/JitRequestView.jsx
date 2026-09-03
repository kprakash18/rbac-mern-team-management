import { useState } from 'react';
import { MY_JIT_HISTORY, AVAILABLE_JIT_ROLES } from '../constants/workspaceApp.constants';

const DURATIONS = ['30m', '1h', '2h', '4h', '8h'];
const RISK_CONFIG = {
  Low: 'bg-success-bg text-success-text',
  Medium: 'bg-warning-bg text-warning-text',
  High: 'bg-error-bg text-error-text',
  Critical: 'bg-error-bg text-error-text border border-error-container',
};
const STATUS_CONFIG = {
  APPROVED: { label: 'Active', class: 'bg-success-bg text-success-text' },
  EXPIRED: { label: 'Expired', class: 'bg-surface-container text-on-surface-variant' },
  REJECTED: { label: 'Rejected', class: 'bg-error-bg text-error-text' },
  PENDING: { label: 'Pending', class: 'bg-warning-bg text-warning-text' },
};

export default function JitRequestView() {
  const [selectedRole, setSelectedRole] = useState('');
  const [duration, setDuration] = useState('1h');
  const [ticketId, setTicketId] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState(MY_JIT_HISTORY);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectedRoleConfig = AVAILABLE_JIT_ROLES.find(r => r.id === selectedRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole || !justification.trim() || !ticketId.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const newRequest = {
        id: `req_${Date.now()}`,
        requestedRole: selectedRole,
        requestedRoleLabel: selectedRoleConfig?.label || selectedRole,
        justification,
        ticketId,
        requestedDuration: duration,
        status: 'PENDING',
        statusLabel: 'Pending',
        approvedBy: null,
        expiresAt: null,
        createdAt: new Date().toISOString(),
      };
      setRequests((prev) => [newRequest, ...prev]);
      setSelectedRole('');
      setDuration('1h');
      setTicketId('');
      setJustification('');
      setSubmitting(false);
      showToast('JIT access request submitted. Awaiting Super Admin approval.');
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-md py-sm rounded-xl shadow-lg flex items-center gap-sm text-[13px] font-semibold transition-all animate-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error' ? 'bg-error-bg text-error-text border border-error-container' : 'bg-inverse-surface text-inverse-on-surface'
        }`}>
          <span className="material-symbols-outlined text-[18px]">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold text-on-surface">Request Elevated Access</h2>
        <p className="text-[13px] text-on-surface-variant mt-0.5">
          Request time-bounded JIT privilege grants. All requests are reviewed by the Super Admin.
        </p>
      </div>

      {/* Form + History Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-xl">
        {/* Request Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-xs overflow-hidden">
            <div className="p-md border-b border-border-subtle">
              <span className="font-bold text-on-surface text-[15px]">New Access Request</span>
            </div>
            <div className="p-md flex flex-col gap-md">
              {/* Role Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Privilege Role *
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {AVAILABLE_JIT_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex items-center gap-sm p-sm rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedRole === role.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border-subtle bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{role.icon}</span>
                      <span className="text-[13px] font-semibold text-on-surface flex-1">{role.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${RISK_CONFIG[role.risk]}`}>
                        {role.risk}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Duration *
                </label>
                <div className="flex gap-xs flex-wrap">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`px-sm py-1.5 rounded-lg text-[13px] font-bold transition-colors cursor-pointer border ${
                        duration === d
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container-low text-on-surface border-border-subtle hover:border-primary/40'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="ticket">
                  Ticket / Incident ID *
                </label>
                <input
                  id="ticket"
                  type="text"
                  placeholder="e.g. OPS-3920, INC-8492"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-[13px] text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
                  required
                />
              </div>

              {/* Business Justification */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="justification">
                  Business Justification *
                </label>
                <textarea
                  id="justification"
                  rows={4}
                  placeholder="Explain why you need this access and what you will do with it..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-[13px] text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-lg bg-primary text-on-primary font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-on-primary-fixed transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Request History */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-xs overflow-hidden flex flex-col">
          <div className="p-md border-b border-border-subtle flex items-center justify-between">
            <span className="font-bold text-on-surface text-[15px]">Request History</span>
            <span className="text-[12px] text-on-surface-variant">{requests.length} total</span>
          </div>
          <div className="divide-y divide-border-subtle overflow-y-auto flex-1">
            {requests.map((req) => {
              const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={req.id} className="p-md flex flex-col gap-xs">
                  <div className="flex items-center justify-between gap-sm">
                    <span className="font-bold text-on-surface text-[13px]">{req.requestedRoleLabel}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusConf.class}`}>
                      {statusConf.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-xs text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">timer</span>
                      {req.requestedDuration}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">confirmation_number</span>
                      {req.ticketId}
                    </span>
                    <span>•</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant line-clamp-2">{req.justification}</p>
                  {req.rejectionReason && (
                    <div className="flex items-start gap-1 bg-error-bg text-error-text text-[11px] rounded-lg px-sm py-xs">
                      <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">info</span>
                      <span>{req.rejectionReason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
