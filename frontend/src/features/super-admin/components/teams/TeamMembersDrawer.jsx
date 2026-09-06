export default function TeamMembersDrawer({
  selectedTeamForMembers,
  onClose,
  memberSearchQuery,
  setMemberSearchQuery,
  onAddMemberRole,
  onInitiateRemoveMemberRole,
  availableRoles,
  onOpenOnboarding,
}) {
  if (!selectedTeamForMembers) return null;

  return (
    <div className="fixed inset-0 z-100 flex justify-end bg-on-primary-fixed/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col border-l border-border-subtle animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-lg border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary font-label-bold flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">{selectedTeamForMembers.icon}</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface">{selectedTeamForMembers.name}</h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                {selectedTeamForMembers.members?.length || selectedTeamForMembers.membersCount || 0} active members assigned
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

        {/* Search & Onboard Action */}
        <div className="p-md border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between gap-sm">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="w-full bg-surface border-none rounded-lg pl-9 pr-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm text-[12px]"
            />
          </div>

          <button
            type="button"
            onClick={() => onOpenOnboarding(selectedTeamForMembers)}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center gap-1 transition-colors cursor-pointer text-[12px] shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Onboard</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-md space-y-sm">
          {(!selectedTeamForMembers.members || selectedTeamForMembers.members.length === 0) ? (
            <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] text-outline">group_off</span>
              <span className="text-body-sm">No member details available for this workspace.</span>
            </div>
          ) : (
            selectedTeamForMembers.members
              .filter((m) => {
                const q = memberSearchQuery.toLowerCase().trim();
                return !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
              })
              .map((m) => {
                const initials = m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
                const memberRoles = m.roles || ['Member'];

                return (
                  <div
                    key={m.id || m._id || m.email}
                    className="p-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-sm border border-border-subtle/50"
                  >
                    <div className="flex items-center justify-between gap-md">
                      <div className="flex items-center gap-md min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-sm shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-bold text-label-bold text-on-surface truncate">{m.name}</span>
                          <span className="text-on-surface-variant text-[12px] truncate">{m.email}</span>
                        </div>
                      </div>

                      {/* Quick Role Adder */}
                      <div className="relative shrink-0">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onAddMemberRole(selectedTeamForMembers, m, e.target.value);
                            }
                          }}
                          className="text-[11px] font-label-bold bg-surface-container-high hover:bg-surface-container text-on-surface px-2 py-1 rounded-md border border-border-subtle cursor-pointer outline-none"
                          title="Assign another role to this member"
                        >
                          <option value="">+ Add Role</option>
                          {availableRoles
                            .filter((r) => !memberRoles.includes(r.name))
                            .map((r) => (
                              <option key={r.id || r.name} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Role Pills */}
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
                              onClick={() => onInitiateRemoveMemberRole(selectedTeamForMembers, m, roleName)}
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

        {/* Footer */}
        <div className="p-md border-t border-border-subtle bg-surface-container-low flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
