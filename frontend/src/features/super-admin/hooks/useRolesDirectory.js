import { useMemo, useState } from 'react';
import { CANONICAL_PERMISSIONS } from '@/constants';

export function useRolesDirectory(roles) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        role.name.toLowerCase().includes(query) ||
        (role.desc || '').toLowerCase().includes(query) ||
        role.permissionKeys.some((key) => key.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (activeFilter === 'System') return role.type === 'system';
      if (activeFilter === 'Custom') return role.type === 'custom';
      if (activeFilter === 'Active') return role.status === 'active';
      if (activeFilter === 'Disabled') return role.status === 'disabled';
      if (activeFilter === 'Archived') return role.status === 'archived';
      return true;
    });
  }, [roles, searchQuery, activeFilter]);

  const metrics = useMemo(() => {
    const total = roles.length;
    const system = roles.filter((role) => role.type === 'system').length;
    const custom = roles.filter((role) => role.type === 'custom').length;
    const activeUsers = roles.reduce(
      (sum, role) => sum + (role.assignedUsers?.length || 0),
      0
    );
    return {
      total,
      system,
      custom,
      activeUsers,
      totalPerms: CANONICAL_PERMISSIONS.length,
    };
  }, [roles]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    viewMode,
    setViewMode,
    filteredRoles,
    metrics,
    clearFilters,
  };
}
