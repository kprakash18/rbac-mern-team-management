import { Modal, Button } from '@/shared/components';

export default function TaskModal({
  isOpen,
  isSaving,
  editingTask,
  canUpdateTask,
  formData,
  setFormData,
  teamMembers,
  onClose,
  onSubmit,
}) {
  const modalTitle = editingTask
    ? canUpdateTask
      ? 'Edit Task'
      : 'Update Status & Remarks'
    : 'New Task';

  const modalSubtitle = editingTask
    ? 'Update task status, priority, or progress notes'
    : 'Create and assign a new sprint task';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon="task_alt"
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="p-md flex flex-col gap-3.5">
        {/* Title */}
        <div>
          <label className="text-label-sm font-label-bold text-on-surface block mb-1">
            Title *
          </label>
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
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Assignee
            </label>
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
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Priority
            </label>
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
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Due Date
            </label>
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
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">
              Status
            </label>
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
            <label className="text-label-sm font-label-bold text-on-surface">
              Remarks / Progress Note
            </label>
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
          <Button
            variant="secondary"
            size="sm"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            loadingText="Saving..."
          >
            {editingTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
