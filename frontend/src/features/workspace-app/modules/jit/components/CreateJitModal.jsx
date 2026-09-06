import { useEffect } from 'react';

const DURATIONS = ['30m', '1h', '2h', '4h', '8h'];

export default function CreateJitModal({
  isOpen,
  permissionsCatalog,
  selectedRole,
  setSelectedRole,
  ticketId,
  setTicketId,
  duration,
  setDuration,
  justification,
  setJustification,
  submitting,
  isTeamAdmin,
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-jit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs"
    >
      <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-md border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 id="create-jit-modal-title" className="font-headline-md text-headline-md text-on-surface font-semibold">
              Request Elevated Privilege
            </h3>
            <p className="text-[12px] text-on-surface-variant">
              Time-bounded Just-in-Time access for emergency or maintenance tasks
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-md flex flex-col gap-3.5">
          {/* Permission / Capability */}
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Target Permission / Capability *
            </label>
            {permissionsCatalog.length > 0 ? (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                {permissionsCatalog.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.key} {p.category ? `(${p.category.replace(/_/g, ' ')})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface-variant">
                Loading permissions…
              </div>
            )}
          </div>

          {/* Ticket & Duration (2 columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                Ticket / Incident Ref *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INC-8492 or ENG-102"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                Lease Duration *
              </label>
              <div className="grid grid-cols-5 gap-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`py-2 text-[12px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      duration === d
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-border-subtle hover:bg-surface-container'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Business Justification *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Explain why this elevation is required for your current task or incident..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
            ></textarea>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">
                {isTeamAdmin ? 'shield' : 'supervisor_account'}
              </span>
              <span>
                {isTeamAdmin
                  ? 'Routes to Super Admin for authorization'
                  : 'Routes to Team Admin for review'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
