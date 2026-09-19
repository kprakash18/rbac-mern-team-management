import RoleCard from './RoleCard';
import RolesTableView from './RolesTableView';

export default function RolesDirectoryContent({
  loading,
  roles,
  searchQuery,
  activeFilter,
  viewMode,
  activeMenuId,
  onToggleCardMenu,
  onClearFilters,
  onCreateRole,
  onOpenDrawer,
  onOpenCreateModal,
  onCloneRole,
  onArchiveToggle,
  onToggleStatus,
  onInitiateDelete,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-md">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-body-base text-on-surface-variant">
          Loading role policies and permissions catalog...
        </p>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card-bg rounded-xl border border-dashed border-border-subtle p-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-outline mb-md">
          <span className="material-symbols-outlined text-[32px]">manage_accounts</span>
        </div>
        <h3 className="font-headline-md text-on-surface">No Roles Found</h3>
        <p className="font-body-base text-on-surface-variant max-w-md mt-1 mb-lg">
          No roles match your search query &ldquo;{searchQuery}&rdquo; and active filter &ldquo;{activeFilter}&rdquo;.
        </p>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={onClearFilters}
            className="px-md py-xs bg-surface-container text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={onCreateRole}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container transition-colors cursor-pointer"
          >
            Create New Role
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            activeMenuId={activeMenuId}
            toggleCardMenu={onToggleCardMenu}
            onOpenDrawer={onOpenDrawer}
            onOpenCreateModal={onOpenCreateModal}
            onCloneRole={onCloneRole}
            onArchiveToggle={onArchiveToggle}
            onToggleStatus={onToggleStatus}
            onInitiateDelete={onInitiateDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <RolesTableView
      roles={roles}
      onOpenDrawer={onOpenDrawer}
      onToggleStatus={onToggleStatus}
    />
  );
}
