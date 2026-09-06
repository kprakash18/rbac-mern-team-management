import { useEffect } from 'react';

export default function TaskModal({
  isOpen,
  editingTask,
  canUpdateTask,
  formData,
  setFormData,
  teamMembers,
  onClose,
  onSave,
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
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs"
    >
      <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-md border-b border-border-subtle flex items-center justify-between">
          <h3 id="task-modal-title" className="font-headline-md text-headline-md text-on-surface font-semibold">
            {editingTask ? (canUpdateTask ? 'Edit Task' : 'Update Status & Remarks') : 'New Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSave} className="p-md flex flex-col gap-3.5">
          {/* Title */}
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">Title *</label>
            <input
              type="text"
              required
              disabled={editingTask && !canUpdateTask}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Implement user profile caching"
              className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary ${
                editingTask && !canUpdateTask ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Assignee & Priority (Two Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">Assignee</label>
              <select
                disabled={editingTask && !canUpdateTask}
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer ${
                  editingTask && !canUpdateTask ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">Priority</label>
              <select
                disabled={editingTask && !canUpdateTask}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer ${
                  editingTask && !canUpdateTask ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date & Status (Two Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">Due Date</label>
              <input
                type="text"
                disabled={editingTask && !canUpdateTask}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                placeholder="e.g. Sep 15, 2026"
                className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary ${
                  editingTask && !canUpdateTask ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="text-label-sm font-label-bold text-on-surface block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-label-sm font-label-bold text-on-surface">Remarks / Progress Note</label>
              <span className="text-[11px] text-success-text font-medium">Assignee can update</span>
            </div>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Progress update, blockers, or completion notes..."
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
            ></textarea>
          </div>

          {/* Modal Buttons */}
          <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity shadow-sm cursor-pointer"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
