import api from '@/lib/api';

export async function getTasks(teamId) {
  const res = await api.get(`/api/teams/${teamId}/tasks`);
  return res.data?.data?.tasks || res.data?.data || [];
}

export async function getTeamMembers(teamId, limit = 100) {
  const res = await api.get(`/api/teams/${teamId}/members`, { params: { limit } });
  return res.data?.data?.members || res.data?.data || [];
}

export async function createTask(teamId, payload) {
  const res = await api.post(`/api/teams/${teamId}/tasks`, payload);
  return res.data?.data || payload;
}

export async function updateTask(teamId, taskId, payload) {
  const res = await api.patch(`/api/teams/${teamId}/tasks/${taskId}`, payload);
  return res.data?.data || payload;
}

export async function deleteTask(teamId, taskId) {
  const res = await api.delete(`/api/teams/${teamId}/tasks/${taskId}`);
  return res.data;
}
