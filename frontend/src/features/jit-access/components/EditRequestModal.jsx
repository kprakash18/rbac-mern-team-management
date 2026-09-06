import { Modal, Button } from '@/shared/components';

export default function EditRequestModal({
  editingRequest,
  onClose,
  editTicketId,
  setEditTicketId,
  editDuration,
  setEditDuration,
  editJustification,
  setEditJustification,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={Boolean(editingRequest)}
      onClose={onClose}
      title="Edit Pending JIT Request"
      subtitle="Update your ticket ID, duration, or justification before review"
      icon="edit_note"
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="p-md flex flex-col gap-4">
        <div>
          <label className="text-label-sm font-label-bold text-on-surface block mb-1">
            Elevated Role
          </label>
          <input
            type="text"
            disabled
            value={editingRequest?.requestedRoleLabel || editingRequest?.roleName || ''}
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
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
