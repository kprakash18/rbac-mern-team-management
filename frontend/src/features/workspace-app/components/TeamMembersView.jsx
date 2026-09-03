import { useState } from 'react';
import { MOCK_TEAM_MEMBERS } from '../constants/workspaceApp.constants';

const ALL_ROLES = ['All Roles', 'Lead Architect', 'Senior Developer', 'DevOps Engineer', 'Developer', 'Auditor'];

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', class: 'bg-success-bg text-success-text' },
  INVITED: { label: 'Invited', class: 'bg-warning-bg text-warning-text' },
  SUSPENDED: { label: 'Suspended', class: 'bg-error-bg text-error-text' },
};

export default function TeamMembersView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  const filtered = MOCK_TEAM_MEMBERS.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold text-on-surface">Team Members</h2>
        <p className="text-[13px] text-on-surface-variant mt-0.5">
          All members in the Engineering Core workspace — {MOCK_TEAM_MEMBERS.length} total.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg text-[13px] text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-border-subtle transition-colors"
            placeholder="Search by name, email, or role..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 bg-surface-container-low rounded-lg text-[13px] text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
        {filtered.map((member) => {
          const statusConf = STATUS_CONFIG[member.status] || STATUS_CONFIG.ACTIVE;
          return (
            <div
              key={member.id}
              className={`bg-surface-container-lowest rounded-xl p-md border shadow-xs flex flex-col gap-sm transition-shadow hover:shadow-md ${
                member.isCurrentUser ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border-subtle'
              }`}
            >
              <div className="flex items-center gap-sm">
                <div className={`w-10 h-10 rounded-full ${member.bgClass} flex items-center justify-center font-bold text-[14px] shrink-0`}>
                  {member.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-on-surface text-[13px] truncate">{member.name}</span>
                    {member.isCurrentUser && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full shrink-0">You</span>
                    )}
                  </div>
                  <span className="text-on-surface-variant text-[11px] truncate block">{member.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-on-surface">{member.role}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConf.class}`}>
                  {statusConf.label}
                </span>
              </div>

              <div className="flex items-center gap-1 text-on-surface-variant text-[11px] pt-xs border-t border-border-subtle">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                <span>{member.lastActive}</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-3 py-2xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] text-outline block mb-xs">group_off</span>
            <span className="font-bold text-on-surface block">No members found</span>
            <span className="text-[12px]">Try adjusting your search or filter.</span>
          </div>
        )}
      </div>
    </div>
  );
}
