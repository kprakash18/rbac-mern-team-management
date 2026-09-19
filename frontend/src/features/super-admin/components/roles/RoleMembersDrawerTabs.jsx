export default function RoleMembersDrawerTabs({ role, activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-border-subtle bg-surface-container-lowest px-lg pt-sm gap-md shrink-0">
      <button
        type="button"
        className={`pb-2.5 text-label-sm font-label-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
          activeTab === 'members'
            ? 'border-primary text-primary'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
        }`}
        onClick={() => onTabChange('members')}
      >
        <span className="material-symbols-outlined text-[18px]">group</span>
        <span>Assigned Users ({role.assignedUsers?.length || role.members})</span>
      </button>
      <button
        type="button"
        className={`pb-2.5 text-label-sm font-label-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
          activeTab === 'permissions'
            ? 'border-primary text-primary'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
        }`}
        onClick={() => onTabChange('permissions')}
      >
        <span className="material-symbols-outlined text-[18px]">key</span>
        <span>Permissions ({role.permissionKeys?.length || role.perms})</span>
      </button>
    </div>
  );
}
