import { DURATIONS } from '../constants/jitConstants';
import { Modal, Button } from '@/shared/components';

export default function NewRequestModal({
  isOpen,
  onClose,
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
  onSubmit,
  isTeamAdmin,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Elevated Privilege"
      subtitle="Time-bounded Just-in-Time access for emergency or maintenance tasks"
      icon="lock_open"
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSubmit} className="p-md flex flex-col gap-3.5">
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
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              loadingText="Submitting..."
            >
              Submit Request
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
