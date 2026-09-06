import EmptyState from '@/components/shared/EmptyState';

const PRIORITY_STYLES = {
  URGENT: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  HIGH: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  MEDIUM: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  LOW: 'bg-slate-50 text-slate-500 border-slate-200 font-medium',
  Urgent: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  High: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  Medium: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  Low: 'bg-slate-50 text-slate-500 border-slate-200 font-medium',
};

const STATUS_STYLES = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  IN_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 font-medium',
};

export default function TaskTable({
  tasks,
  currentUserId,
  canUpdateTask,
  canDeleteTask,
  getMember,
  onQuickStatusChange,
  onOpenEditModal,
  onDeleteTask,
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-190">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-container-low text-[12px] font-semibold text-on-surface-variant">
              <th className="py-3 px-4 w-32">Status</th>
              <th className="py-3 px-4">Task Details</th>
              <th className="py-3 px-4 w-28 text-center">Priority</th>
              <th className="py-3 px-4 w-36">Deadline</th>
              <th className="py-3 px-4 w-48">Assignee</th>
              <th className="py-3 px-4 w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-body-sm">
            {tasks.map((task) => {
              const assignee = getMember(task.assignedTo);
              const isAssignee = task.assignedTo === currentUserId;
              const canEdit = isAssignee || canUpdateTask;

              return (
                <tr
                  key={task.id}
                  className="hover:bg-surface-container-low/60 transition-colors"
                >
                  {/* Status Selector */}
                  <td className="py-3.5 px-4 w-32 align-top">
                    <select
                      value={task.status}
                      disabled={!canEdit}
                      onChange={(e) => onQuickStatusChange(task.id, e.target.value)}
                      className={`w-full px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer outline-none transition-colors ${
                        STATUS_STYLES[task.status] || STATUS_STYLES.TODO
                      } ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>

                  {/* Task Title & Remarks */}
                  <td className="py-3.5 px-4 min-w-65 align-top">
                    <div className="flex flex-col">
                      <span className="font-label-bold text-[13px] text-on-surface leading-tight">
                        {task.title}
                      </span>
                      {task.remarks && (
                        <span className="text-[11px] text-on-surface-variant italic mt-1 line-clamp-1">
                          Note: {task.remarks}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Priority (Fixed Width & Centered Alignment) */}
                  <td className="py-3.5 px-4 w-28 text-center align-top">
                    <span
                      className={`inline-block w-20 px-2 py-0.5 rounded text-[11px] font-medium border text-center ${
                        PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  {/* Deadline */}
                  <td className="py-3.5 px-4 w-36 whitespace-nowrap align-top">
                    <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant font-mono mt-0.5">
                      <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                      <span>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No deadline'}
                      </span>
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4 w-48 align-top">
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isAssignee ? 'bg-primary text-on-primary ring-1 ring-primary' : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {assignee.initials}
                      </div>
                      <span className="text-[12px] font-medium text-on-surface truncate">
                        {assignee.name} {isAssignee && '(You)'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 w-20 text-right align-top">
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(task)}
                          title={isAssignee && !canUpdateTask ? 'Update Status & Remarks' : 'Edit Task'}
                          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      )}
                      {canDeleteTask && (
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id || task._id)}
                          title="Delete Task"
                          className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <EmptyState
          icon="task_alt"
          title="No tasks match your filters"
          message="Try clearing search or switching status tabs."
        />
      )}
    </>
  );
}
