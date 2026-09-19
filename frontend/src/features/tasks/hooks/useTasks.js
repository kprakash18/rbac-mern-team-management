import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { queryKeys } from '@/lib/queryKeys';
import * as tasksApi from '../api/tasksApi';

export function useTasks({ teamId, currentUserId }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  const normalizeTask = useCallback((t) => ({
    ...t,
    id: t._id || t.id,
    remarks: t.remarks || t.description || '',
    assignedTo: t.assignedTo?._id || t.assignedTo?.id || t.assignedTo,
  }), []);

  // 1. TanStack Query for Tasks (2 minutes staleTime)
  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    isFetching: isTasksFetching,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: queryKeys.tasks.list(teamId),
    queryFn: async () => {
      if (!teamId) return [];
      const raw = await tasksApi.getTasks(teamId);
      return (raw || []).map(normalizeTask);
    },
    enabled: Boolean(teamId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });

  // 2. TanStack Query for Team Members (3 minutes staleTime)
  const {
    data: teamMembers = [],
    isLoading: isMembersLoading,
  } = useQuery({
    queryKey: queryKeys.team.memberList(teamId),
    queryFn: async () => {
      if (!teamId) return [];
      const rawMembers = await tasksApi.getTeamMembers(teamId, 100);
      return (rawMembers || []).map((m) => ({
        id: m.userId?._id || m.user?._id || m.userId || m.id || m._id,
        name: m.userId?.name || m.user?.name || m.name || 'Member',
        email: m.userId?.email || m.user?.email || m.email || '',
        initials: (m.userId?.name || m.user?.name || m.name || 'M')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      }));
    },
    enabled: Boolean(teamId),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
  });

  // 3. Setter helper for backward compatibility that synchronizes with TanStack cache
  const setTasks = useCallback(
    (updater) => {
      queryClient.setQueryData(queryKeys.tasks.list(teamId), (old = []) => {
        if (typeof updater === 'function') {
          return updater(old);
        }
        return updater;
      });
    },
    [queryClient, teamId]
  );

  // 4. WebSocket synchronization
  useEffect(() => {
    if (!teamId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleTaskUpdated = ({ task }) => {
      if (!task) return;
      const normalized = normalizeTask(task);
      queryClient.setQueryData(queryKeys.tasks.list(teamId), (prev = []) => {
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
      const normalized = normalizeTask(task);
      queryClient.setQueryData(queryKeys.tasks.list(teamId), (prev = []) => {
        const exists = prev.some((t) => t.id === normalized.id || t._id === normalized._id);
        return exists ? prev : [normalized, ...prev];
      });
    };

    const handleTaskDeleted = ({ taskId }) => {
      if (!taskId) return;
      queryClient.setQueryData(queryKeys.tasks.list(teamId), (prev = []) =>
        prev.filter((t) => t.id !== taskId && t._id !== taskId)
      );
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [teamId, queryClient, normalizeTask]);

  // 5. Optimistic Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }) => tasksApi.updateTask(teamId, taskId, { status: newStatus }),
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list(teamId) });
      const previousTasks = queryClient.getQueryData(queryKeys.tasks.list(teamId));
      queryClient.setQueryData(queryKeys.tasks.list(teamId), (old = []) =>
        old.map((t) => (t.id === taskId || t._id === taskId ? { ...t, status: newStatus } : t))
      );
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(teamId), context.previousTasks);
      }
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update task status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(teamId) });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksApi.deleteTask(teamId, taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list(teamId) });
      const previousTasks = queryClient.getQueryData(queryKeys.tasks.list(teamId));
      queryClient.setQueryData(queryKeys.tasks.list(teamId), (old = []) =>
        old.filter((t) => t.id !== taskId && t._id !== taskId)
      );
      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(teamId), context.previousTasks);
      }
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete task.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(teamId) });
    },
  });

  const quickStatusChange = useCallback(
    (taskId, newStatus) => {
      updateStatusMutation.mutate({ taskId, newStatus });
    },
    [updateStatusMutation]
  );

  const removeTask = useCallback(
    (taskId) => {
      if (!window.confirm('Delete this task?')) return;
      deleteTaskMutation.mutate(taskId);
    },
    [deleteTaskMutation]
  );

  const getMember = useCallback(
    (id) => teamMembers.find((m) => m.id === id) || { name: 'Unassigned', initials: 'UN' },
    [teamMembers]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.remarks && t.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'ALL' || t.assignedTo === currentUserId;

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchQuery, statusFilter, assigneeFilter, currentUserId]);

  const loading = isTasksLoading || isMembersLoading;

  return {
    tasks,
    setTasks,
    teamMembers,
    loading,
    isTasksLoading,
    isTasksFetching,
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
    refreshTasks: refetchTasks,
  };
}
