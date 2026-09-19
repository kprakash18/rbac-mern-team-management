import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { normalizeTeamMember } from './chatModel';

export function useChatMembers(teamId) {
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (!teamId) return;

    api.get(`/api/teams/${teamId}/members`)
      .then((res) => {
        const raw = res.data?.data?.members || res.data?.data || [];
        setTeamMembers(raw.map(normalizeTeamMember));
      })
      .catch((err) => console.error('Failed to load chat team members:', err));
  }, [teamId]);

  return teamMembers;
}
