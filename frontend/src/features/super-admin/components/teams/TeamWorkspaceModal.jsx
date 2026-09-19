export default function TeamWorkspaceModal({
  isOpen,
  editingTeam,
  activeTab,
  onTabChange,
  availableRoleCount,
  selectedUserCount,
  onClose,
  children,
}) {
  if (!isOpen) return null;

  const tabClass = (tab) =>
    `pb-2.5 font-label-bold text-label-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
      activeTab === tab
        ? 'border-primary text-primary'
        : 'border-transparent text-on-surface-variant hover:text-on-surface'
    }`;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-on-primary-fixed/40 backdrop-blur-sm p-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-lg pb-md border-b border-border-subtle bg-surface-container-low shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                {editingTeam ? 'tune' : 'add_business'}
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                {editingTeam ? 'Team Workspace Settings' : 'Create New Team'}
              </h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                {editingTeam
                  ? 'Modify team metadata, lifecycle state, and member role assignments.'
                  : 'Provision a new isolated team workspace and assign domain policies.'}
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

        <div className="flex items-center gap-md px-lg pt-sm bg-surface-container-low border-b border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('general')}
            className={tabClass('general')}
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span>{editingTeam ? 'General Settings' : '1. General Details'}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('roles')}
            className={tabClass('roles')}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>{editingTeam ? 'Team Roles & Members' : '2. Team Roles'}</span>
            {editingTeam && (
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-[11px]">
                {editingTeam.members?.length || 0}
              </span>
            )}
            {!editingTeam && availableRoleCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-[11px]">
                {availableRoleCount}
              </span>
            )}
          </button>

          {!editingTeam && (
            <button
              type="button"
              onClick={() => onTabChange('members')}
              className={tabClass('members')}
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>3. Add Members</span>
              {selectedUserCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-bold text-[11px]">
                  {selectedUserCount}
                </span>
              )}
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
