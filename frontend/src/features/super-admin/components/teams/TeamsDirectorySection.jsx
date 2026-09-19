import TeamsToolbar from './TeamsToolbar.jsx';
import TeamsTable from './TeamsTable.jsx';
import TeamsGrid from './TeamsGrid.jsx';

export default function TeamsDirectorySection({
  teams,
  loading,
  searchQuery,
  onSearchChange,
  filterTabs,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onCreateTeam,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onOpenMembers,
  onOnboard,
  onManageRoles,
  onEdit,
  onToggleArchive,
  onJumpIntoWorkspace,
}) {
  const listProps = {
    teams,
    loading,
    page,
    totalPages,
    total,
    limit,
    onPageChange,
    onOpenMembers,
    onOnboard,
    onManageRoles,
    onEdit,
    onToggleArchive,
    onJumpIntoWorkspace,
  };

  return (
    <>
      <TeamsToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filterTabs={filterTabs}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onCreateTeam={onCreateTeam}
      />

      {viewMode === 'table' ? (
        <TeamsTable {...listProps} />
      ) : (
        <TeamsGrid {...listProps} />
      )}
    </>
  );
}
