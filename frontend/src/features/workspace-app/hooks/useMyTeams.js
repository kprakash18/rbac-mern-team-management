import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

function formatTeam(t) {
  return {
    ...t,
    id: t._id || t.id,
    name: t.name,
    role: t.role || (t.isTeamAdmin ? 'Team Admin' : 'Developer'),
    isTeamAdmin: Boolean(
      t.isTeamAdmin || t.role === 'Team Admin' || t.role?.toLowerCase().includes('admin')
    ),
    icon: t.icon || 'domain',
    iconBgColor: t.iconBgColor || 'bg-primary/10 text-primary',
  };
}

export function useMyTeams({ isSuperAdmin, enabled = true }) {
  return useQuery({
    queryKey: ['teams', isSuperAdmin ? 'all' : 'my-teams'],
    queryFn: async () => {
      const endpoint = isSuperAdmin ? '/api/teams' : '/api/teams/my-teams';
      const res = await api.get(endpoint);
      const rawTeams = res.data?.data?.teams || res.data?.data || [];
      return rawTeams.map(formatTeam);
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes cache freshness
  });
}
