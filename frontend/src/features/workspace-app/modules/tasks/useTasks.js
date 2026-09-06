import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { useWorkspace } from '@/context/useWorkspace';

export function useTasks(teamId, currentUserId) {
  const { can } = useWorkspace();
  const isTeamAdmin = can('team.admin') || can('role.assign');
  const canCreateTask = can('task.create') || isTeamAdmin;
  const canUpdateTask = can('task.update') || isTeamAdmin;
  const canDeleteTask = can('task.delete') || isTeamAdmin;

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL'); // 'ALL' | 'ME'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: '',
    priority: 'MEDIUM',
    dueDate: '',
    status: 'TODO',
    remarks: '',
  });

  const fetchTasksAndMembers = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [tasksRes, membersRes] = await Promise.allSettled([
        api.get(`/api/teams/${teamId}/tasks`),
        api.get(`/api/teams/${teamId}/members?limit=100`),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const rawTasks = tasksRes.value.data?.data?.tasks || tasksRes.value.data?.data || [];
        const normalized = rawTasks.map((t) => ({
          ...t,
          id: t._id || t.id,
          remarks: t.remarks || t.description || '',
          assignedTo: t.assignedTo?._id || t.assignedTo?.id || t.assignedTo,
        }));
        setTasks(normalized);
      }

      if (membersRes.status === 'fulfilled') {
        const rawMembers = membersRes.value.data?.data?.members || membersRes.value.data?.data || [];
        setTeamMembers(
          rawMembers.map((m) => ({
            id: m.userId?._id || m.user?._id || m.userId || m.id || m._id,
            name: m.userId?.name || m.user?.name || m.name || 'Member',
            email: m.userId?.email || m.user?.email || m.email || '',
            initials: (m.userId?.name || m.user?.name || m.name || 'M')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const normalizeTask = useCallback((t) => ({
    ...t,
    id: t._id || t.id,
    remarks: t.remarks || t.description || '',
    assignedTo: t.assignedTo?._id || t.assignedTo?.id || t.assignedTo,
  }), []);

  const normalizeRef = useRef(normalizeTask);
  useEffect(() => {
    normalizeRef.current = normalizeTask;
  }, [normalizeTask]);

  useEffect(() => {
    if (!teamId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleTaskUpdated = ({ task }) => {
      if (!task) return;
      const normalized = normalizeRef.current(task);
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === normalized.id || t._id === normalized._id);
        if (exists) {
          return prev.map((t) =>
            t.id === normalized.id || t._id === normalized._id ? { ...t, ...normalized } : t
          );
        }
        return prev;
      });
    };

    const handleTaskCreated = ({ task }) => {
      if (!task) return;
      const normalized = normalizeRef.current(task);
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === normalized.id || t._id === normalized._id);
        return exists ? prev : [normalized, ...prev];
      });
    };

    const handleTaskDeleted = ({ taskId }) => {
      if (!taskId) return;
      setTasks((prev) => prev.filter((t) => t.id !== taskId && t._id !== taskId));
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [teamId]);

  useEffect(() => {
    fetchTasksAndMembers();
  }, [fetchTasksAndMembers]);

  const getMember = useCallback(
    (id) => teamMembers.find((m) => m.id === id) || { name: 'Unassigned', initials: 'UN' },
    [teamMembers]
  );

  const handleOpenCreateModal = useCallback(() => {
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
  }, [currentUserId, teamMembers]);

  const handleOpenEditModal = useCallback((task) => {
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
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSaveTask = useCallback(
    async (e) => {
      e.preventDefault();
      if (!teamId) return;

      const isAssigneeOnly =
        editingTask && editingTask.assignedTo === currentUserId && !canUpdateTask;

      if (!isAssigneeOnly && !formData.title.trim()) return;

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

          const res = await api.patch(`/api/teams/${teamId}/tasks/${taskId}`, payload);
          const updated = res.data?.data || payload;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, ...updated, id: taskId, remarks: formData.remarks } : t
            )
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

          const res = await api.post(`/api/teams/${teamId}/tasks`, payload);
          const created = res.data?.data || payload;
          const normalized = {
            ...created,
            id: created._id || created.id,
            remarks: formData.remarks,
          };
          setTasks((prev) => [normalized, ...prev]);
        }
        setIsModalOpen(false);
      } catch (err) {
        console.error('Failed to save task:', err);
        alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save task.');
      }
    },
    [teamId, editingTask, currentUserId, canUpdateTask, formData]
  );

  const handleDeleteTask = useCallback(
    async (taskId) => {
      if (!window.confirm('Delete this task?')) return;
      try {
        await api.delete(`/api/teams/${teamId}/tasks/${taskId}`);
        setTasks((prev) => prev.filter((t) => t.id !== taskId && t._id !== taskId));
      } catch (err) {
        console.error('Failed to delete task:', err);
        alert(err.response?.data?.error?.message || 'Failed to delete task.');
      }
    },
    [teamId]
  );

  const handleQuickStatusChange = useCallback(
    async (taskId, newStatus) => {
      try {
        await api.patch(`/api/teams/${teamId}/tasks/${taskId}`, { status: newStatus });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      } catch (err) {
        console.error('Failed to update status:', err);
        alert(err.response?.data?.error?.message || 'Failed to update task status.');
      }
    },
    [teamId]
  );

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.remarks && t.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || t.assignedTo === currentUserId;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  return {
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
    refresh: fetchTasksAndMembers,
  };
}
