import { STATUS_STYLES } from '../constants/taskConstants';
import { Avatar, Badge } from '@/shared/components';

export default function TaskRow({
  task,
  assignee,
  isAssignee,
  canEdit,
  canUpdateTask,
  canDeleteTask,
  onQuickStatusChange,
  onEdit,
  onDelete,
}) {
  const priorityVariant =
    task.priority === 'URGENT' || task.priority === 'Urgent'
      ? 'danger'
      : task.priority === 'HIGH' || task.priority === 'High'
      ? 'warning'
      : 'neutral';

  return (
    <tr className="hover:bg-surface-container-low/60 transition-colors">
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

      <td className="py-3.5 px-4 w-28 text-center align-top">
        <Badge variant={priorityVariant} size="sm" className="w-20">
          {task.priority}
        </Badge>
      </td>

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

      <td className="py-3.5 px-4 w-48 align-top">
        <div className="flex items-center gap-2 mt-0.5">
          <Avatar
            name={assignee.name}
            initials={assignee.initials}
            isCurrentUser={isAssignee}
            size="sm"
          />
          <span className="text-[12px] font-medium text-on-surface truncate">
            {assignee.name} {isAssignee && '(You)'}
          </span>
        </div>
      </td>

      <td className="py-3.5 px-4 w-20 text-right align-top">
        <div className="flex items-center justify-end gap-1 mt-0.5">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
              title={isAssignee && !canUpdateTask ? 'Update Status & Remarks' : 'Edit Task'}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          )}
          {canDeleteTask && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
              title="Delete Task"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
