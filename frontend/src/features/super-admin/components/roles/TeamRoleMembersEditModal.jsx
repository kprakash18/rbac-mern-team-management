export default function TeamRoleMembersEditModal({
  team,
  roleName,
  teamMembers,
  selectedMemberIds,
  onSelectedMemberIdsChange,
  search,
  onSearchChange,
  onClose,
  onSubmit,
}) {
  const toggleAllMembers = () => {
    if (selectedMemberIds.size === teamMembers.length) {
      onSelectedMemberIdsChange(new Set());
    } else {
      onSelectedMemberIdsChange(new Set(teamMembers.map((member) => member.id)));
    }
  };

  const toggleMember = (memberId) => {
    onSelectedMemberIdsChange((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const filteredMembers = teamMembers.filter((member) => {
    const query = search.toLowerCase().trim();
    return !query || (member.name || '').toLowerCase().includes(query) || (member.email || '').toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-low border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Manage &ldquo;{roleName}&rdquo; Members
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant">Team: {team.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-lg flex flex-col gap-md overflow-y-auto flex-1">
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-bold text-label-sm text-on-surface">
                Assigned Members ({selectedMemberIds.size} of {teamMembers.length})
              </label>
              <button
                type="button"
                onClick={toggleAllMembers}
                className="text-[12px] font-label-bold text-primary hover:underline cursor-pointer"
              >
                {selectedMemberIds.size === teamMembers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">search</span>
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-surface-container-low rounded-md text-[12px] text-on-surface focus:outline-none mb-1.5"
              />
            </div>

            <div className="max-h-56 overflow-y-auto bg-surface-container-low rounded-xl p-xs space-y-1 border border-border-subtle">
              {filteredMembers.map((member) => {
                const isChecked = selectedMemberIds.has(member.id);
                return (
                  <label
                    key={member.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isChecked ? 'bg-surface-container-lowest shadow-2xs' : 'hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMember(member.id)}
                        className="rounded text-primary focus:ring-0 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className="font-medium text-on-surface text-[12px] block truncate">{member.name}</span>
                        <span className="text-on-surface-variant text-[11px] block truncate">{member.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-outline shrink-0">
                      {(member.roles || ['Member']).join(', ')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-sm mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container shadow-sm cursor-pointer"
            >
              Save Assignments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
