import api from '@/lib/api';

export async function getAccessRequests(teamId) {
  const res = await api.get(`/api/teams/${teamId}/access-requests`);
  return res.data?.data?.accessRequests || res.data?.data || [];
}

export async function getTeamPermissionsCatalog() {
  const res = await api.get('/api/permissions', { params: { scope: 'team' } });
  return res.data?.data || [];
}

export async function createAccessRequest(teamId, payload) {
  const res = await api.post(`/api/teams/${teamId}/access-requests`, payload);
  return res.data?.data || payload;
}

export async function updateAccessRequest(teamId, requestId, payload) {
  const res = await api.patch(`/api/teams/${teamId}/access-requests/${requestId}`, payload);
  return res.data?.data || payload;
}

export async function approveAccessRequest(teamId, requestId) {
  const res = await api.post(`/api/teams/${teamId}/access-requests/${requestId}/approve`);
  return res.data;
}

export async function rejectAccessRequest(teamId, requestId, reason) {
  const res = await api.post(`/api/teams/${teamId}/access-requests/${requestId}/reject`, { reason });
  return res.data;
}

export async function revokeAccessRequest(teamId, requestId) {
  const res = await api.delete(`/api/teams/${teamId}/access-requests/${requestId}/revoke`);
  return res.data;
}

export async function deleteAccessRequest(teamId, requestId) {
  const res = await api.delete(`/api/teams/${teamId}/access-requests/${requestId}`);
  return res.data;
}
