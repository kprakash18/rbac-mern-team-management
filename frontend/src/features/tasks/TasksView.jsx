import { useState, useCallback } from 'react';
import { useApp } from '@/context/useApp';
import { Button, Tabs, LoadingState, SearchInput, EmptyState } from '@/shared/components';
import { useTasks } from './hooks/useTasks';
import * as tasksApi from './api/tasksApi';
import TaskRow from './components/TaskRow';
import TaskModal from './components/TaskModal';
import { STATUS_TABS } from './constants/taskConstants';

export default function TasksView({ currentUser, workspace }) {
  const { activeWorkspace, hasPermission: appHasPermission } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);

  const hasPermission = useCallback((permKey) => {
    if (currentUser?.hasPermission) return currentUser.hasPermission(permKey);
    if (appHasPermission) return appHasPermission(permKey);
    if (isTeamAdmin || currentUser?.isSuperAdmin) return true;
    const perms = currentUser?.permissions || [];
    return perms.includes(permKey) || perms.includes('*');
  }, [currentUser, appHasPermission, isTeamAdmin]);

  const canCreateTask = hasPermission('task.create');
  const canUpdateTask = hasPermission('task.update');
  const canDeleteTask = hasPermission('task.delete');

  const {
    tasks,
    setTasks,
    teamMembers,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    assigneeFilter,
    setAssigneeFilter,
    filteredTasks,
    getMember,
    quickStatusChange,
    removeTask,
  } = useTasks({ teamId, currentUserId });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: '',
    priority: 'MEDIUM',
    dueDate: '',
    status: 'TODO',
    remarks: '',
  });

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      assignedTo: currentUserId || teamMembers[0]?.id || '',
      priority: 'MEDIUM',
      dueDate: '',
      status: 'TODO',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      assignedTo: task.assignedTo || '',
      priority: (task.priority || 'MEDIUM').toUpperCase(),
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      status: task.status || 'TODO',
      remarks: task.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!teamId || isSaving) return;

    const isAssigneeOnly = editingTask &&
      editingTask.assignedTo === currentUserId &&
      !canUpdateTask;

    if (!isAssigneeOnly && !formData.title.trim()) return;

    setIsSaving(true);
    try {
      if (editingTask) {
        const taskId = editingTask._id || editingTask.id;

        const payload = isAssigneeOnly
          ? {
              status: formData.status,
              remarks: formData.remarks,
            }
          : {
              title: formData.title,
              status: formData.status,
              priority: formData.priority,
              remarks: formData.remarks,
              description: formData.remarks,
              assignedTo: formData.assignedTo || null,
              dueDate: formData.dueDate || null,
            };

        const updated = await tasksApi.updateTask(teamId, taskId, payload);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId || t._id === taskId ? { ...t, ...updated, id: taskId, remarks: formData.remarks } : t))
        );
      } else {
        const payload = {
          title: formData.title,
          assignedTo: formData.assignedTo || null,
          priority: formData.priority,
          status: formData.status,
          description: formData.remarks,
          dueDate: formData.dueDate || null,
        };

        const created = await tasksApi.createTask(teamId, payload);
        const normalized = {
          ...created,
          id: created._id || created.id,
          remarks: formData.remarks,
        };
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === normalized.id || t._id === normalized._id);
          return exists ? prev : [normalized, ...prev];
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            Tasks &amp; Sprints
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {tasks.length} tasks in {workspace?.name || 'Workspace'} • {tasks.filter((t) => t.status === 'IN_PROGRESS').length} in progress
          </p>
        </div>

        {canCreateTask && (
          <Button
            variant="primary"
            size="md"
            icon="add_task"
            onClick={handleOpenCreateModal}
            className="self-start md:self-auto"
          >
            + Create Task
          </Button>
        )}
      </div>

      {/* Simplified Filter & Search Bar */}
      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search tasks or remarks..."
            className="flex-1 max-w-md"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* My Tasks vs All Tasks Toggle */}
          <Tabs
            options={[
              { key: 'ALL', label: 'All Tasks' },
              { key: 'ME', label: 'Assigned to Me' },
            ]}
            value={assigneeFilter}
            onChange={setAssigneeFilter}
          />

          {/* Status Tabs */}
          <Tabs
            options={STATUS_TABS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Consistent Table Layout */}
      <div className="w-full bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState message="Loading workspace tasks..." />
        ) : (
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
                  {filteredTasks.map((task) => {
                    const assignee = getMember(task.assignedTo);
                    const isAssignee = task.assignedTo === currentUserId;
                    const canEdit = isAssignee || canUpdateTask;

                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        assignee={assignee}
                        isAssignee={isAssignee}
                        canEdit={canEdit}
                        canUpdateTask={canUpdateTask}
                        canDeleteTask={canDeleteTask}
                        onQuickStatusChange={quickStatusChange}
                        onEdit={handleOpenEditModal}
                        onDelete={removeTask}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <EmptyState
                icon="task_alt"
                title="No tasks match your filters"
                message="Try clearing search or switching status tabs."
              />
            )}
          </>
        )}
      </div>

      {/* Modal Dialog */}
      <TaskModal
        isOpen={isModalOpen}
        isSaving={isSaving}
        editingTask={editingTask}
        canUpdateTask={canUpdateTask}
        formData={formData}
        setFormData={setFormData}
        teamMembers={teamMembers}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTask}
      />
    </div>
  );
}
