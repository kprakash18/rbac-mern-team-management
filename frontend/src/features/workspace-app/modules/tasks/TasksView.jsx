import { useApp } from '@/context/useApp';
import { useTasks } from './useTasks';
import TaskTable from './components/TaskTable';
import TaskModal from './components/TaskModal';
import SearchInput from '@/components/shared/SearchInput';

export default function TasksView({ currentUser, workspace }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;

  const {
    tasks,
    teamMembers,
    filteredTasks,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    assigneeFilter,
    setAssigneeFilter,
    isModalOpen,
    editingTask,
    formData,
    setFormData,
    canCreateTask,
    canUpdateTask,
    canDeleteTask,
    getMember,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveTask,
    handleDeleteTask,
    handleQuickStatusChange,
  } = useTasks(teamId, currentUserId);

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            Tasks &amp; Sprints
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {tasks.length} tasks in {activeWorkspace?.name || 'this workspace'} •{' '}
            {tasks.filter((t) => t.status === 'IN_PROGRESS').length} in progress
          </p>
        </div>
        {/* Right: Actions */}
        {canCreateTask && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary font-label-bold text-label-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Task</span>
          </button>
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
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle flex-wrap">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'TODO', label: 'To Do' },
              { key: 'IN_PROGRESS', label: 'In Progress' },
              { key: 'IN_REVIEW', label: 'In Review' },
              { key: 'DONE', label: 'Done' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                  statusFilter === key
                    ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Consistent Table Layout */}
      <div className="w-full bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
            <span className="text-[13px] font-medium">Loading workspace tasks...</span>
          </div>
        ) : (
          <TaskTable
            tasks={filteredTasks}
            currentUserId={currentUserId}
            canUpdateTask={canUpdateTask}
            canDeleteTask={canDeleteTask}
            getMember={getMember}
            onQuickStatusChange={handleQuickStatusChange}
            onOpenEditModal={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </div>

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        editingTask={editingTask}
        canUpdateTask={canUpdateTask}
        formData={formData}
        setFormData={setFormData}
        teamMembers={teamMembers}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
      />
    </div>
  );
}
