import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import * as tasksApi from '../api/tasksApi';

export function useTasks({ teamId, currentUserId }) {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  const normalizeTask = useCallback((t) => ({
    ...t,
    id: t._id || t.id,
    remarks: t.remarks || t.description || '',
    assignedTo: t.assignedTo?._id || t.assignedTo?.id || t.assignedTo,
  }), []);

  const fetchTasksAndMembers = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [rawTasks, rawMembers] = await Promise.all([
        tasksApi.getTasks(teamId).catch(() => []),
        tasksApi.getTeamMembers(teamId, 100).catch(() => []),
      ]);

      const normalizedTasks = rawTasks.map((t) => ({
        ...t,
        id: t._id || t.id,
        remarks: t.remarks || t.description || '',
        assignedTo: t.assignedTo?._id || t.assignedTo?.id || t.assignedTo,
      }));
      setTasks(normalizedTasks);

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
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

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
            (t.id === normalized.id || t._id === normalized._id) ? { ...t, ...normalized } : t
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

  const quickStatusChange = async (taskId, newStatus) => {
    try {
      await tasksApi.updateTask(teamId, taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.error?.message || 'Failed to update task status.');
    }
  };

  const removeTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.deleteTask(teamId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId && t._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err.response?.data?.error?.message || 'Failed to delete task.');
    }
  };

  const getMember = (id) =>
    teamMembers.find((m) => m.id === id) || { name: 'Unassigned', initials: 'UN' };

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
    refreshTasks: fetchTasksAndMembers,
  };
}
