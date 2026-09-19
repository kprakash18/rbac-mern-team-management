import { useEffect, useState } from 'react';
import { getTeamMembers } from '../api/teamsApi.js';

const DRAWER_PAGE_SIZE = 10;

export function useTeamMembersDrawer() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const openDrawer = (team) => {
    setPage(1);
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedTeam(team);
  };

  const closeDrawer = () => setSelectedTeam(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedTeam?.id) return;

    let isMounted = true;
    setLoading(true);

    getTeamMembers({
      teamId: selectedTeam.id,
      page,
      limit: DRAWER_PAGE_SIZE,
      search: debouncedSearch,
    })
      .then(({ members, total: nextTotal, totalPages: nextTotalPages }) => {
        if (!isMounted) return;
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);
        setSelectedTeam((prev) =>
          prev ? { ...prev, members, membersCount: nextTotal } : null
        );
      })
      .catch((err) => {
        console.warn('Could not load team members:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTeam?.id, page, debouncedSearch]);

  return {
    selectedTeam,
    setSelectedTeam,
    loading,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    total,
    totalPages,
    pageSize: DRAWER_PAGE_SIZE,
    openDrawer,
    closeDrawer,
  };
}
