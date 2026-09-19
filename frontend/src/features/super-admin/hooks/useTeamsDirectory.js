import { useMemo, useState } from 'react';

export function useTeamsDirectory(teams, pageSize = 10) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        team.name.toLowerCase().includes(query) ||
        (team.description && team.description.toLowerCase().includes(query));

      const matchesFilter =
        activeFilter === 'All' ||
        team.status.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [teams, searchQuery, activeFilter]);

  const totalItems = filteredTeams.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTeams = filteredTeams.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const handleFilterChange = (tab) => {
    setActiveFilter(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return {
    searchQuery,
    activeFilter,
    viewMode,
    setViewMode,
    pageSize,
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    paginatedTeams,
    setCurrentPage,
    handleFilterChange,
    handleSearchChange,
  };
}
