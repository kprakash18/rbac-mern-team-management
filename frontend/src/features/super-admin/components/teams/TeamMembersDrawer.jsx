import { Pagination } from '@/shared/components';

export default function TeamMembersDrawer({
  team,
  loading,
  searchQuery,
  onSearchChange,
  availableRoles,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onClose,
  onOnboard,
  onAddRole,
  onRemoveRole,
}) {
  if (!team) return null;

  return (
    <div className="fixed inset-0 z-100 flex justify-end bg-on-primary-fixed/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col border-l border-border-subtle animate-in slide-in-from-right duration-200">
        <div className="p-lg border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary font-label-bold flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">{team.icon}</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface">{team.name}</h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                {total.toLocaleString()} active members assigned
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-md border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between gap-sm">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-surface border-none rounded-lg pl-9 pr-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm text-[12px]"
            />
          </div>

          <button
            type="button"
            onClick={() => onOnboard(team)}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center gap-1 transition-colors cursor-pointer text-[12px] shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Onboard</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-md space-y-sm">
          {loading ? (
            <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] animate-spin text-primary">progress_activity</span>
              <span className="text-body-sm">Loading workspace members...</span>
            </div>
          ) : (!team.members || team.members.length === 0) ? (
            <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] text-outline">group_off</span>
              <span className="text-body-sm">No member details available for this workspace.</span>
            </div>
          ) : (
            team.members.map((member) => {
              const initials = member.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
              const memberRoles = member.roles || ['Member'];

              return (
                <div
                  key={member.id || member._id || member.email}
                  className="p-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-sm border border-border-subtle/50"
                >
                  <div className="flex items-center justify-between gap-md">
                    <div className="flex items-center gap-md min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-sm shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-bold text-label-bold text-on-surface truncate">{member.name}</span>
                        <span className="text-on-surface-variant text-[12px] truncate">{member.email}</span>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) onAddRole(team, member, e.target.value);
                        }}
                        className="text-[11px] font-label-bold bg-surface-container-high hover:bg-surface-container text-on-surface px-2 py-1 rounded-md border border-border-subtle cursor-pointer outline-none"
                        title="Assign another role to this member"
                      >
                        <option value="">+ Add Role</option>
                        {availableRoles
                          .filter((role) => !memberRoles.includes(role.name))
                          .map((role) => (
                            <option key={role.id || role.name} value={role.name}>
                              {role.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {memberRoles.map((roleName) => {
                      const isTeamAdmin = roleName.toLowerCase().includes('admin');
                      return (
                        <span
                          key={roleName}
                          className={`px-2 py-0.5 rounded-md font-label-sm text-[11px] shadow-2xs flex items-center gap-1.5 transition-all ${
                            isTeamAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-medium'
                              : 'bg-surface-container-highest text-on-surface border border-border-subtle'
                          }`}
                        >
                          {isTeamAdmin && (
                            <span className="material-symbols-outlined text-[12px] text-amber-600">crown</span>
                          )}
                          <span>{roleName}</span>
                          <button
                            type="button"
                            onClick={() => onRemoveRole(team, member, roleName)}
                            className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center text-outline hover:text-error-text cursor-pointer ml-0.5"
                            title={`Remove "${roleName}" role`}
                          >
                            <span className="material-symbols-outlined text-[11px]">close</span>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-border-subtle bg-surface-container-low flex flex-col gap-2">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            itemLabel="members"
            loading={loading}
            onPageChange={onPageChange}
            compact={true}
            className="!bg-transparent !border-0 !p-0 !rounded-none !shadow-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer text-[12px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
