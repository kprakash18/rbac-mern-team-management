import api from '@/lib/api';

function inferTeamIcon(teamName = '') {
  const nameLower = teamName.toLowerCase();
  if (nameLower.includes('sec')) return 'security';
  if (nameLower.includes('devops') || nameLower.includes('cloud') || nameLower.includes('infra')) return 'cloud';
  if (nameLower.includes('data') || nameLower.includes('ai') || nameLower.includes('lab')) return 'dataset';
  if (nameLower.includes('product') || nameLower.includes('design')) return 'palette';
  if (nameLower.includes('support') || nameLower.includes('operat') || nameLower.includes('customer')) return 'support_agent';
  if (nameLower.includes('finance')) return 'payments';
  if (nameLower.includes('marketing')) return 'campaign';
  return 'engineering';
}

export function formatTeam(team) {
  const id = team._id || team.id;
  const status = (team.status || 'ACTIVE').toUpperCase();
  const memberList = Array.isArray(team.members)
    ? team.members.map((member) => ({
        ...member,
        id: member.id || member._id || member.email,
        roles: Array.isArray(member.roles) && member.roles.length > 0 ? member.roles : ['Member'],
      }))
    : [];

  return {
    id,
    _id: id,
    name: team.name,
    description: team.description || 'Organizational team workspace.',
    status: status === 'ACTIVE' ? 'Active' : status === 'ARCHIVED' ? 'Archived' : status,
    statusType: status === 'ACTIVE' ? 'active' : 'archived',
    membersCount: team.membersCount ?? (memberList.length > 0 ? memberList.length : 1),
    admins: Array.isArray(team.admins) && team.admins.length > 0 ? team.admins : (team.createdBy?.name ? [team.createdBy.name] : ['Team Admin']),
    members: memberList,
    createdBy: team.createdBy,
    createdAt: team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
    icon: team.icon || inferTeamIcon(team.name),
  };
}

export function formatTeamMember(member) {
  return {
    id: member.userId?._id || member.userId?.id || member._id,
    membershipId: member._id,
    name: member.userId?.name || 'Member',
    email: member.userId?.email || '',
    roles: Array.isArray(member.roleIds)
      ? member.roleIds.map((role) => role.name || role)
      : (member.roles?.map((role) => role.name || role) || ['Member']),
    joinedAt: member.joinedAt,
  };
}

export async function getTeamsAndRoles() {
  const [teamsRes, rolesRes] = await Promise.allSettled([
    api.get('/api/teams?status=all'),
    api.get('/api/roles?status=all'),
  ]);

  const rawTeams = teamsRes.status === 'fulfilled' ? (teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || []) : [];
  const roles = rolesRes.status === 'fulfilled' ? (rolesRes.value.data?.data || []) : [];

  return {
    teams: Array.isArray(rawTeams) ? rawTeams.map(formatTeam) : [],
    roles,
  };
}

export async function getTeamMembers({ teamId, page, limit, search }) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('q', search);

  const res = await api.get(`/api/teams/${teamId}/members?${params.toString()}`);
  const rawMembers = res.data?.data?.members || res.data?.data || [];
  const pagination = res.data?.pagination || {};
  const total = pagination.total ?? rawMembers.length ?? 0;

  return {
    members: rawMembers.map(formatTeamMember),
    total,
    totalPages: Math.max(1, pagination.totalPages || Math.ceil(total / limit) || 1),
  };
}

export async function getActivePlatformUsers() {
  const res = await api.get('/api/users?status=ACTIVE&limit=100');
  const users = res.data?.data || res.data?.users || [];
  return users.filter((user) => (user.accountStatus || user.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
}

export async function createTeam(payload) {
  const res = await api.post('/api/teams', payload);
  return res.data?.data || res.data;
}

export async function updateTeam(teamId, payload) {
  const res = await api.patch(`/api/teams/${teamId}`, payload);
  return res.data?.data || res.data;
}

export async function archiveTeam(teamId) {
  return api.delete(`/api/teams/${teamId}`);
}

export async function restoreTeam(teamId) {
  return api.patch(`/api/teams/${teamId}`, { status: 'ACTIVE' });
}

export async function addTeamMember(teamId, payload) {
  return api.post(`/api/teams/${teamId}/members`, payload);
}
