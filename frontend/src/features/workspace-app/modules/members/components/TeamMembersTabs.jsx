function TabButton({ active, count, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-label-sm font-label-bold transition-colors cursor-pointer ${
        active
          ? 'bg-primary text-on-primary shadow-xs'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-[11px] ${active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
        {count.toLocaleString()}
      </span>
    </button>
  );
}

function TeamMembersTabs({ activeTab, invitationCount, memberCount, onTabChange }) {
  return (
    <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
      <TabButton
        active={activeTab === 'members'}
        count={memberCount}
        icon="group"
        label="Active Members"
        onClick={() => onTabChange('members')}
      />
      <TabButton
        active={activeTab === 'invitations'}
        count={invitationCount}
        icon="mail"
        label="Pending Invitations"
        onClick={() => onTabChange('invitations')}
      />
    </div>
  );
}

export default TeamMembersTabs;
