import { useState } from 'react';

const WORKSPACE_MEMBERS = [
  { id: 'usr-dm', name: 'Diana Morales', role: 'Lead Architect', initials: 'DM' },
  { id: 'usr-cd', name: 'Charlie Davis', role: 'Senior Staff SRE', initials: 'CD' },
  { id: 'usr-aj', name: 'Alice Johnson', role: 'DevOps Engineer', initials: 'AJ' },
  { id: 'usr-er', name: 'Elena Rostova', role: 'Security Auditor', initials: 'ER' },
  { id: 'usr-mv', name: 'Marcus Vance', role: 'Senior Backend Developer', initials: 'MV' },
  { id: 'usr-sl', name: 'Sophia Lin', role: 'Lead UI Engineer', initials: 'SL' },
];

const INITIAL_TASKS = [
  {
    id: 'tsk-101',
    title: 'Implement user profile caching layer',
    assignedTo: 'usr-dm',
    status: 'IN_PROGRESS',
    priority: 'High',
    dueDate: 'Sep 5, 2026',
    remarks: 'Caching configured in staging; latency reduced by 40ms.',
  },
  {
    id: 'tsk-102',
    title: 'Optimize database queries for team roster',
    assignedTo: 'usr-cd',
    status: 'IN_PROGRESS',
    priority: 'Urgent',
    dueDate: 'Sep 4, 2026',
    remarks: 'Added index on teamId and status fields.',
  },
  {
    id: 'tsk-103',
    title: 'Update API authentication tokens and session expiry',
    assignedTo: 'usr-aj',
    status: 'TODO',
    priority: 'High',
    dueDate: 'Sep 7, 2026',
    remarks: 'Awaiting review from security team.',
  },
  {
    id: 'tsk-104',
    title: 'Review Q3 workspace audit and compliance logs',
    assignedTo: 'usr-er',
    status: 'IN_PROGRESS',
    priority: 'Medium',
    dueDate: 'Sep 9, 2026',
    remarks: 'Exported quarterly access logs for audit compliance.',
  },
  {
    id: 'tsk-105',
    title: 'Deploy API service release v2.4.1',
    assignedTo: 'usr-mv',
    status: 'DONE',
    priority: 'Medium',
    dueDate: 'Sep 3, 2026',
    remarks: 'Successfully deployed to production with zero downtime.',
  },
  {
    id: 'tsk-106',
    title: 'Design System color contrast accessibility pass',
    assignedTo: 'usr-sl',
    status: 'TODO',
    priority: 'Low',
    dueDate: 'Sep 11, 2026',
    remarks: 'Tokens verified for WCAG AA compliance.',
  },
];

const PRIORITY_STYLES = {
  Urgent: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  High: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  Medium: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  Low: 'bg-slate-50 text-slate-500 border-slate-200 font-medium',
};

const STATUS_STYLES = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
};

export default function TasksView({ currentUser }) {
  const currentUserId = currentUser?.id || 'usr-dm';
  const isTeamAdmin = currentUser?.isTeamAdmin ?? true;

  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL'); // 'ALL' | 'ME'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: 'usr-dm',
    priority: 'Medium',
    dueDate: '',
    status: 'TODO',
    remarks: '',
  });

  const getMember = (id) =>
    WORKSPACE_MEMBERS.find((m) => m.id === id) || { name: 'Unassigned', initials: 'UN' };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      assignedTo: currentUserId,
      priority: 'Medium',
      dueDate: 'Sep 10, 2026',
      status: 'TODO',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      remarks: task.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: isTeamAdmin ? formData.title : t.title,
                assignedTo: isTeamAdmin ? formData.assignedTo : t.assignedTo,
                priority: isTeamAdmin ? formData.priority : t.priority,
                dueDate: isTeamAdmin ? formData.dueDate : t.dueDate,
                status: formData.status,
                remarks: formData.remarks,
              }
            : t
        )
      );
    } else {
      const newTask = {
        id: `tsk-${Date.now().toString().slice(-4)}`,
        title: formData.title,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        dueDate: formData.dueDate,
        status: formData.status,
        remarks: formData.remarks,
      };
      setTasks((prev) => [newTask, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleQuickStatusChange = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.remarks && t.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || t.assignedTo === currentUserId;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            Tasks &amp; Sprints
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {tasks.length} tasks in Acme Engineering • {tasks.filter((t) => t.status === 'IN_PROGRESS').length} in progress
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-sm text-label-sm transition-opacity shadow-sm cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          <span>+ Create Task</span>
        </button>
      </div>

      {/* Simplified Filter & Search Bar */}
      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex items-center flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:border-primary outline-none transition-colors"
              placeholder="Search tasks or remarks..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* My Tasks vs All Tasks Toggle */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setAssigneeFilter('ALL')}
              className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                assigneeFilter === 'ALL'
                  ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => setAssigneeFilter('ME')}
              className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                assigneeFilter === 'ME'
                  ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Assigned to Me
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                  statusFilter === s
                    ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Consistent Table Layout */}
      <div className="w-full bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
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
              {filteredTasks.map((task) => {
                const assignee = getMember(task.assignedTo);
                const isAssignee = task.assignedTo === currentUserId;
                const canEdit = isAssignee || isTeamAdmin;

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
                        onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                        className={`w-full px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer outline-none transition-colors ${
                          STATUS_STYLES[task.status] || STATUS_STYLES.TODO
                        } ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>

                    {/* Task Title & Remarks */}
                    <td className="py-3.5 px-4 min-w-[260px] align-top">
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
                        <span>{task.dueDate}</span>
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
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                            title={isAssignee && !isTeamAdmin ? 'Update Status & Remarks' : 'Edit Task'}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                        {isTeamAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                            title="Delete Task (Team Admin only)"
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

        {filteredTasks.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] block mb-1 text-on-surface-variant/50">
              task_alt
            </span>
            <span className="font-semibold text-on-surface block">No tasks match your filters</span>
            <span className="text-[12px]">Try clearing search or switching status tabs.</span>
          </div>
        )}
      </div>

      {/* Clean Create / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                {editingTask ? (isTeamAdmin ? 'Edit Task' : 'Update Status & Remarks') : 'New Task'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-md flex flex-col gap-3.5">
              {/* Title */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  disabled={editingTask && !isTeamAdmin}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Implement user profile caching"
                  className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary ${
                    editingTask && !isTeamAdmin ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Assignee & Priority (Two Columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-sm font-label-bold text-on-surface block mb-1">Assignee</label>
                  <select
                    disabled={editingTask && !isTeamAdmin}
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer ${
                      editingTask && !isTeamAdmin ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {WORKSPACE_MEMBERS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-label-sm font-label-bold text-on-surface block mb-1">Priority</label>
                  <select
                    disabled={editingTask && !isTeamAdmin}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer ${
                      editingTask && !isTeamAdmin ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Status (Two Columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-sm font-label-bold text-on-surface block mb-1">Due Date</label>
                  <input
                    type="text"
                    disabled={editingTask && !isTeamAdmin}
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    placeholder="e.g. Sep 15, 2026"
                    className={`w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary ${
                      editingTask && !isTeamAdmin ? 'opacity-60 cursor-not-allowed' : ''
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
                    <option value="DONE">Done</option>
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
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
}
