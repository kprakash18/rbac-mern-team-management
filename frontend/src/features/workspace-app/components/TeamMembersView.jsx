import { useState } from 'react';

const SIMPLE_TEAM_MEMBERS = [
  {
    id: 'usr-dm',
    name: 'Diana Morales',
    initials: 'DM',
    email: 'diana.m@acme.corp',
    role: 'Lead Architect',
    teamRole: 'Team Admin',
    department: 'Platform Architecture',
    status: 'Active',
    joinedDate: 'Jan 2024',
    permissions: ['Team Administration', 'Task Full Access', 'JIT Access Approval', 'Audit Log Access'],
  },
  {
    id: 'usr-cd',
    name: 'Charlie Davis',
    initials: 'CD',
    email: 'charlie.d@acme.corp',
    role: 'Senior Staff SRE',
    teamRole: 'Project Manager',
    department: 'Reliability & Database Systems',
    status: 'Active',
    joinedDate: 'Mar 2024',
    permissions: ['Task Management', 'Deployment Approvals', 'Access Request', 'System Monitoring'],
  },
  {
    id: 'usr-aj',
    name: 'Alice Johnson',
    initials: 'AJ',
    email: 'alice.j@acme.corp',
    role: 'DevOps Engineer',
    teamRole: 'Developer',
    department: 'Cloud Infrastructure',
    status: 'Active',
    joinedDate: 'Apr 2024',
    permissions: ['Task Create & Update', 'CI/CD Pipelines', 'Access Request'],
  },
  {
    id: 'usr-er',
    name: 'Elena Rostova',
    initials: 'ER',
    email: 'elena.r@acme.corp',
    role: 'Security Auditor',
    teamRole: 'Security Auditor',
    department: 'Governance & Compliance',
    status: 'On-Call',
    joinedDate: 'Feb 2024',
    permissions: ['Audit Log Read', 'Security Policy Inspection', 'Access Request'],
  },
  {
    id: 'usr-mv',
    name: 'Marcus Vance',
    initials: 'MV',
    email: 'marcus.v@acme.corp',
    role: 'Senior Backend Developer',
    teamRole: 'Developer',
    department: 'API & Gateway Services',
    status: 'Active',
    joinedDate: 'May 2024',
    permissions: ['Task Create & Update', 'API Deployment', 'Access Request'],
  },
  {
    id: 'usr-sl',
    name: 'Sophia Lin',
    initials: 'SL',
    email: 'sophia.l@acme.corp',
    role: 'Lead UI Engineer',
    teamRole: 'Developer',
    department: 'Design System & Frontend',
    status: 'Active',
    joinedDate: 'Jun 2024',
    permissions: ['Task Create & Update', 'Frontend Release', 'Access Request'],
  },
];

const ROLES_FILTER_OPTIONS = [
  'All Roles',
  'Lead Architect',
  'Senior Staff SRE',
  'DevOps Engineer',
  'Security Auditor',
  'Senior Backend Developer',
  'Lead UI Engineer',
];

export default function TeamMembersView({ currentUser, onOpenDirectMessage }) {
  const currentUserId = currentUser?.id || 'usr-dm';
  const isTeamAdmin = currentUser?.isTeamAdmin ?? true;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenMember = (member) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  const filteredMembers = SIMPLE_TEAM_MEMBERS.filter((member) => {
    const matchesSearch =
      !searchQuery ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      selectedRole === 'All Roles' || member.role.toLowerCase() === selectedRole.toLowerCase();

    const matchesStatus =
      statusFilter === 'All' || member.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            Team &amp; Members
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {SIMPLE_TEAM_MEMBERS.length} active team members in Acme Engineering
          </p>
        </div>

        <div className="flex items-center gap-sm">
          {isTeamAdmin ? (
            <button
              type="button"
              onClick={() => alert('Invite member modal opened.')}
              className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-sm text-label-sm transition-opacity shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Invite Member</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-xs px-md py-2 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm opacity-60 cursor-not-allowed border border-border-subtle select-none"
              title="Restricted: Only Team Admins can invite new members to this workspace."
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>+ Invite Member</span>
            </div>
          )}
        </div>
      </div>

      {/* Clean Filter & Search Bar */}
      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative flex items-center flex-1 min-w-[200px] max-w-md">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:border-primary outline-none transition-colors"
              placeholder="Search by name, email, or role..."
              type="text"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-label-sm font-label-sm bg-surface-container-low border border-border-subtle rounded-lg px-3 py-1.5 text-on-surface cursor-pointer focus:border-primary outline-none"
          >
            {ROLES_FILTER_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            {['All', 'Active', 'On-Call'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                  statusFilter === tab
                    ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex items-center border border-border-subtle rounded-lg overflow-hidden bg-surface-container-low">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 border-r border-border-subtle cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface-container-lowest text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface-container-lowest text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md w-full">
          {filteredMembers.map((member) => {
            const isUser = member.id === currentUserId;

            return (
              <div
                key={member.id}
                onClick={() => handleOpenMember(member)}
                className={`p-lg rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-md cursor-pointer border ${
                  isUser
                    ? 'border-2 border-primary/30 hover:border-primary'
                    : 'border-border-subtle hover:border-outline'
                }`}
              >
                {/* Top: Avatar, Name, Email, Role */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-label-bold text-sm shadow-xs ${
                          isUser
                            ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {member.initials}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-surface-container-lowest ${
                          member.status === 'Active' ? 'bg-success-text' : 'bg-warning-text'
                        }`}
                        title={member.status}
                      ></span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-label-bold text-label-bold text-on-surface truncate">
                          {member.name}
                        </h3>
                        {isUser && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-fixed shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-on-surface-variant truncate">{member.email}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 ${
                      member.teamRole === 'Team Admin'
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                {/* Middle: Department & Status */}
                <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border-subtle text-on-surface-variant">
                  <span className="truncate">{member.department}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 ${
                      member.status === 'Active'
                        ? 'bg-success-bg text-success-text'
                        : 'bg-warning-bg text-warning-text'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                {/* Bottom Action */}
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70">
                  <span className="text-[11px] text-on-surface-variant">Joined {member.joinedDate}</span>
                  <div className="flex items-center gap-2">
                    {member.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDirectMessage?.(member);
                        }}
                        className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                        title={`Direct message ${member.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </button>
                    )}
                    <span className="text-label-sm font-label-bold text-primary inline-flex items-center gap-0.5 hover:underline">
                      <span>Profile</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="w-full bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-low text-[12px] font-semibold text-on-surface-variant">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-body-sm">
              {filteredMembers.map((member) => {
                const isUser = member.id === currentUserId;

                return (
                  <tr
                    key={member.id}
                    onClick={() => handleOpenMember(member)}
                    className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isUser ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {member.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-bold text-on-surface">{member.name}</span>
                            {isUser && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-primary text-on-primary">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-on-surface-variant block">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-on-surface">{member.role}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{member.department}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          member.status === 'Active'
                            ? 'bg-success-bg text-success-text'
                            : 'bg-warning-bg text-warning-text'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-[12px]">{member.joinedDate}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {member.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDirectMessage?.(member);
                            }}
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                            title={`Direct message ${member.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                          </button>
                        )}
                        <span className="text-label-sm font-label-bold text-primary hover:underline inline-flex items-center gap-0.5">
                          <span>Details</span>
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Clean Member Profile Slide-over Drawer */}
      {isDrawerOpen && selectedMember && (
        <>
          <div
            className="fixed inset-0 bg-on-surface/20 backdrop-blur-[1px] z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          <aside className="fixed top-0 right-0 w-full sm:w-[420px] h-screen bg-surface-container-lowest border-l border-border-subtle shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="p-md border-b border-border-subtle flex items-center justify-between sticky top-0 bg-surface-container-lowest/95 backdrop-blur z-10">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Member Details
                </h2>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-md flex flex-col gap-lg">
                {/* Profile Card */}
                <div className="flex items-center gap-3.5 pb-md border-b border-border-subtle">
                  <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-lg shadow-sm">
                    {selectedMember.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-md text-[18px] font-semibold text-on-surface">
                        {selectedMember.name}
                      </h3>
                      {selectedMember.id === currentUserId && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-primary text-on-primary">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{selectedMember.email}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-medium">
                      {selectedMember.role}
                    </span>
                  </div>
                </div>

                {/* Team & Position Info */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-label-bold text-label-bold text-on-surface">Overview</h4>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-2 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Team Role</span>
                      <span className="font-semibold text-on-surface">{selectedMember.teamRole}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                      <span className="text-on-surface-variant">Department</span>
                      <span className="font-medium text-on-surface">{selectedMember.department}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                      <span className="text-on-surface-variant">Status</span>
                      <span className="text-success-text font-semibold">{selectedMember.status}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                      <span className="text-on-surface-variant">Joined Workspace</span>
                      <span className="text-on-surface">{selectedMember.joinedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-label-bold text-label-bold text-on-surface">Active Capabilities</h4>
                  <div className="flex flex-col gap-2">
                    {selectedMember.permissions.map((perm, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-surface-container-low/80 border border-border-subtle flex items-center gap-2 text-[12px]"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                        <span className="font-medium text-on-surface">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-md border-t border-border-subtle bg-surface-container-lowest flex items-center gap-2 sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  onOpenDirectMessage?.(selectedMember);
                  setIsDrawerOpen(false);
                }}
                className="flex-1 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Send Message</span>
              </button>
              {isTeamAdmin && selectedMember.id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => alert(`Managing role and access for ${selectedMember.name}...`)}
                  className="px-md py-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
                >
                  Manage Role
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
