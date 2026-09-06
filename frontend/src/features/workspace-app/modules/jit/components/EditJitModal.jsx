import { useEffect } from 'react';

export default function EditJitModal({
  editingRequest,
  editTicketId,
  setEditTicketId,
  editDuration,
  setEditDuration,
  editJustification,
  setEditJustification,
  onClose,
  onSave,
}) {
  useEffect(() => {
    if (!editingRequest) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingRequest, onClose]);

  if (!editingRequest) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-jit-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl p-lg flex flex-col gap-md border border-border-subtle animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-sm border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h3 id="edit-jit-modal-title" className="font-headline-md text-[16px] font-bold text-on-surface">
                Edit Pending JIT Request
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                Update your ticket ID, duration, or justification before review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={onSave} className="flex flex-col gap-4">
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Elevated Role
            </label>
            <input
              type="text"
              disabled
              value={editingRequest.requestedRoleLabel || editingRequest.roleName}
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                Ticket ID / Issue Key
              </label>
              <input
                type="text"
                required
                value={editTicketId}
                onChange={(e) => setEditTicketId(e.target.value)}
                placeholder="e.g. INC-8492"
                className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                Requested Duration
              </label>
              <select
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
                <option value="2h">2 hours</option>
                <option value="4h">4 hours</option>
                <option value="8h">8 hours (Full Shift)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Business &amp; Technical Justification
            </label>
            <textarea
              required
              rows={3}
              value={editJustification}
              onChange={(e) => setEditJustification(e.target.value)}
              placeholder="Explain why this elevated lease is necessary..."
              className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold cursor-pointer shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
