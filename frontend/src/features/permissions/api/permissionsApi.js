import api from '@/lib/api';

export async function getPermissionCatalog() {
  const res = await api.get('/api/permissions');
  return res.data?.data?.permissions || res.data?.data || [];
}
