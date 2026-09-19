const TABS = [
  { id: 'pending', icon: 'pending_actions', label: 'Pending Team Admin Requests', countClass: 'bg-error-container text-on-error-container px-xs rounded-full font-label-sm text-label-sm ml-xs' },
  { id: 'active', icon: 'timer', label: 'Active Grants', countClass: 'bg-surface-container text-on-surface px-1.5 py-0.5 rounded-full text-[11px] ml-xs' },
  { id: 'history', icon: 'history', label: 'Audit History', countClass: 'bg-surface-container text-on-surface px-1.5 py-0.5 rounded-full text-[11px] ml-xs' },
];

function JitAccessTabs({ activeTab, counts, onTabChange }) {
  return (
    <div className="flex gap-md border-b border-surface-variant mb-md">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-md py-sm border-b-2 font-label-bold text-label-bold flex items-center gap-xs transition-colors cursor-pointer ${
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
          {tab.label}
          <span className={tab.countClass}>{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  );
}

export default JitAccessTabs;
