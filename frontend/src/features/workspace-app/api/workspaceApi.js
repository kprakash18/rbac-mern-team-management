import api from '@/lib/api';

export async function getWorkspaceBootstrap(teamId) {
  if (!teamId) return null;
  const res = await api.get(`/api/teams/${teamId}/bootstrap`);
  return res.data?.data || null;
}

export async function getActiveBulletins(teamId) {
  const res = await api.get('/api/notifications/bulletins/active', {
    params: teamId ? { teamId } : {},
  });
  return res.data?.data || [];
}
