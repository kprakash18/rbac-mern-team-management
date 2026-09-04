import { useState } from 'react';
import CreateUserModal from './CreateUserModal';
import InviteSuccessModal from './InviteSuccessModal';
import ManageUserModal from './ManageUserModal';

const MOCK_USERS = [
  {
    id: 'usr-mv',
    name: 'Marcus Vance',
    email: 'marcus.v@acme.corp',
    status: 'Active',
    statusType: 'active',
    workspaces: [{ name: 'Engineering Core', role: 'Developer', isTeamAdmin: false, isHigh: false }],
    lastLogin: '1 hour ago',
    avatar: '',
    initials: 'MV',
    mustChangePassword: false,
  },
  {
    id: 'usr-1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    status: 'Active',
    statusType: 'active',
    workspaces: [
      { name: 'Engineering', isHigh: false },
      { name: 'Product', isHigh: true },
    ],
    lastLogin: '2 mins ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBysFz9oCsMdF38cs7hykPgxkiYcv2EcsdVIen4upFt98I_SjPJKlx2YoueepBFNLdSBgXGLOenJ7HvYdn7K-lqqRmV1sXIxCwbunqrFMjgN1ym7--1xkRgANU2oXlgGm8TIByO6l9F4krtOv1Se5xKLlLBkr79BxXuQIi68X3Jz1Zi69j4nY7f4XRHFqHCIxlJzQ2R5bju4cqpp_m8A21TmNXIiqx8d9ib7k3xcHHxq2V6IkEznWv_7w',
    initials: 'AJ',
  },
  {
    id: 'usr-2',
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    status: 'Invited',
    statusType: 'invited',
    workspaces: [{ name: 'Design', isHigh: false }],
    lastLogin: 'Never',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6zEJerrMuitWcYJ-zTSaCYzXCLhqRNYTmb0RSDXttfmcL3JPcQiM94E-516kQwnutPIkelWq2S68cNH1B2KJN1a15PEgd6FUwp0bzyEbevVJG92GdYQd4Ag3-B5tQgwT1EgCSgDPEXqRdg5GDH1CZmKy3QwlwLYsdhlvTvFUNvjxQccEifrcvkGZv3Zhm59eJm0ubiSt8rqqL1n-7dyxyCjtXApFpRzYyjarqcGYB2CjYhogxMrcXaw',
    initials: 'BS',
  },
  {
    id: 'usr-3',
    name: 'Charlie Davis',
    email: 'cdavis@example.com',
    status: 'Suspended',
    statusType: 'suspended',
    workspaces: [{ name: 'Marketing', isHigh: false, isOpacity: true }],
    lastLogin: 'Oct 24, 2023',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOTWZJVnN8EJqWpM13QYoX_lDr7EQMLoFundxuVUk5Ey_3WjLB363Cl9NZBjmL1RtV0Rta2b_AV486ycT39a_4fserpNB1w-ZKyRA3MdCtpBtVYub2wRgCEKOjjgIwwcaKGutFKfxpN4WXitpLHmmcid0IgBbMCWhi2GlrgBoc8mXtQ9hgUpElrUuJNJeLGlh_V0KhEqENOvUwTIgycDWO_ugahe5lzdl0oTBy-FymbyNIRASP4TFq4w',
    initials: 'CD',
  },
  {
    id: 'usr-4',
    name: 'Dana White',
    email: 'dana.w@example.com',
    status: 'Disabled',
    statusType: 'disabled',
    workspaces: [{ name: 'Engineering Core', isHigh: false, isOpacity: true }],
    lastLogin: 'Jan 12, 2023',
    avatar: '',
    initials: 'DW',
  },
];

export default function UsersAccessView() {
  const [users, setUsers] = useState(() => {
    try {
      const stored = localStorage.getItem('platform_users_list');
      if (stored) return JSON.parse(stored);
    } catch {}
    return MOCK_USERS;
  });
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inviteSuccessData, setInviteSuccessData] = useState(null);
  const [selectedUserForManage, setSelectedUserForManage] = useState(null);

  const filterTabs = ['All', 'Active', 'Invited', 'Suspended', 'Disabled'];

  const handleFilterChange = (tab) => {
    setActiveFilter(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSaveManagedUser = (updatedUser) => {
    setUsers((prev) => {
      const nextList = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      try {
        localStorage.setItem('platform_users_list', JSON.stringify(nextList));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
      return nextList;
    });

    try {
      const currentSession = JSON.parse(localStorage.getItem('auth_session') || '{}');
      if (currentSession.email && currentSession.email.toLowerCase() === updatedUser.email.toLowerCase()) {
        currentSession.mustChangePassword = Boolean(updatedUser.mustChangePassword);
        currentSession.status = updatedUser.status;
        currentSession.accountStatus = (updatedUser.status || 'ACTIVE').toUpperCase();
        localStorage.setItem('auth_session', JSON.stringify(currentSession));
      }
    } catch {
      // ignore
    }
  };

  const handleInviteUser = (newUserData) => {
    const assignedWorkspaces = newUserData.assignments?.map((a) => ({
      name: a.workspace,
      role: a.role,
      isTeamAdmin: Boolean(a.isTeamAdmin),
      isHigh: Boolean(a.isTeamAdmin),
    })) || [
      {
        name: newUserData.workspace,
        role: newUserData.role,
        isTeamAdmin: Boolean(newUserData.isTeamAdmin),
        isHigh: Boolean(newUserData.isTeamAdmin),
      },
    ];

    setUsers((prev) => {
      const existingIndex = prev.findIndex(
        (u) => u.email.toLowerCase() === newUserData.email.trim().toLowerCase()
      );
      if (existingIndex >= 0) {
        // Append new workspace(s) to existing user
        const existing = prev[existingIndex];
        const existingNames = new Set(existing.workspaces.map((w) => w.name));
        const newUniqueWorkspaces = assignedWorkspaces.filter(
          (w) => !existingNames.has(w.name)
        );
        const updated = {
          ...existing,
          workspaces: [...existing.workspaces, ...newUniqueWorkspaces],
          isTeamAdmin: existing.isTeamAdmin || Boolean(newUserData.isTeamAdmin),
          isSuperAdmin: newUserData.isSuperAdmin !== undefined ? newUserData.isSuperAdmin : existing.isSuperAdmin,
        };
        const nextList = [...prev];
        nextList[existingIndex] = updated;
        return nextList;
      }

      // Brand new user
      const newUser = {
        id: `usr-${Date.now()}`,
        name: newUserData.fullName,
        email: newUserData.email,
        status: 'Invited',
        statusType: 'invited',
        workspaces: assignedWorkspaces,
        isTeamAdmin: Boolean(newUserData.isTeamAdmin),
        isSuperAdmin: Boolean(newUserData.isSuperAdmin),
        lastLogin: 'Never',
        avatar: '',
        initials:
          newUserData.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U',
      };
      return [newUser, ...prev];
    });

    // Open success modal
    setInviteSuccessData({
      fullName: newUserData.fullName,
      email: newUserData.email,
      assignments: newUserData.assignments,
      workspace: newUserData.workspace,
      role: newUserData.role,
      inviteLink: `https://app.company.com/invite/tok_${Math.random().toString(36).substring(2, 12)}`,
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter =
      activeFilter === 'All' ||
      u.status.toLowerCase() === activeFilter.toLowerCase() ||
      u.statusType?.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);
  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  return (
    <div className="flex flex-col w-full h-full max-w-[1280px] mx-auto px-lg py-xl space-y-xl">
      <div className="flex flex-col space-y-xs">
        <h1 className="font-display-title text-display-title text-on-surface">Users &amp; Access</h1>
        <p className="font-body-base text-body-base text-on-surface-variant">Global identity and access management.</p>
      </div>

      <div className="flex items-center justify-between w-full p-md bg-surface-container rounded-xl shadow-sm">
        <div className="relative w-[320px]">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-surface border-none rounded-lg pl-[40px] pr-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
            placeholder="Search users by name or email..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-xs">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleFilterChange(tab)}
              className={`px-md py-xs font-label-bold text-label-bold rounded-lg shadow-sm transition-colors cursor-pointer ${
                activeFilter === tab
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-md px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            &nbsp;Create User
          </button>
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-bold text-label-bold">
              <th className="py-md px-lg font-semibold border-b border-border-subtle">User</th>
              <th className="py-md px-lg font-semibold border-b border-border-subtle">Account Status</th>
              <th className="py-md px-lg font-semibold border-b border-border-subtle">Workspaces</th>
              <th className="py-md px-lg font-semibold border-b border-border-subtle">Last Login</th>
              <th className="py-md px-lg font-semibold border-b border-border-subtle text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-xl px-lg text-center text-on-surface-variant">
                  No users found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-lowest transition-colors border-b border-border-subtle group">
                  <td className="py-lg px-lg">
                    <div className="flex items-center gap-md">
                      {user.avatar ? (
                        <img
                          className={`w-10 h-10 rounded-full object-cover shadow-sm ${
                            user.statusType === 'suspended' || user.statusType === 'disabled'
                              ? 'grayscale opacity-60'
                              : ''
                          }`}
                          src={user.avatar}
                          alt={user.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`${user.avatar ? 'hidden' : ''} w-10 h-10 rounded-full bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-sm`}>
                        {user.initials}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-xs">
                          <span className="font-label-bold text-label-bold text-on-surface">{user.name}</span>
                          {user.isSuperAdmin && (
                            <span className="material-symbols-outlined text-warning-text text-[16px]" title="Platform Super Admin">
                              local_police
                            </span>
                          )}
                          {user.isTeamAdmin && !user.isSuperAdmin && (
                            <span className="material-symbols-outlined text-amber-500 text-[16px]" title="Team Admin (Workspace Administrator)">
                              crown
                            </span>
                          )}
                        </div>
                        <span className="text-on-surface-variant">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-lg px-lg">
                    {user.statusType === 'active' && (
                      <span className="inline-flex items-center px-sm py-[2px] rounded-full bg-success-bg text-success-text font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-text mr-xs"></span>Active
                      </span>
                    )}
                    {user.statusType === 'invited' && (
                      <span className="inline-flex items-center px-sm py-[2px] rounded-full bg-warning-bg text-warning-text font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning-text mr-xs"></span>Invited
                      </span>
                    )}
                    {user.statusType === 'suspended' && (
                      <span className="inline-flex items-center px-sm py-[2px] rounded-full bg-error-bg text-error-text font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-error-text mr-xs"></span>Suspended
                      </span>
                    )}
                    {user.statusType === 'disabled' && (
                      <span className="inline-flex items-center px-sm py-[2px] rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant mr-xs"></span>Disabled
                      </span>
                    )}
                    {user.mustChangePassword && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-label-sm text-[11px] font-medium border border-amber-300" title="Super Admin forced password reset on next login">
                          <span className="material-symbols-outlined text-[12px] mr-1">lock_reset</span>PW Reset Required
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-lg px-lg">
                    <div className="flex gap-xs flex-wrap">
                      {user.workspaces.map((ws, i) => (
                        <span
                          key={i}
                          className={`px-xs py-base rounded-md font-label-sm text-label-sm shadow-sm flex items-center gap-1 ${
                            ws.isTeamAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                              : ws.isHigh
                              ? 'bg-surface-container-high text-on-surface-variant'
                              : 'bg-secondary-container text-on-secondary-container'
                          } ${ws.isOpacity ? 'opacity-50' : ''}`}
                        >
                          {ws.isTeamAdmin && (
                            <span className="material-symbols-outlined text-[13px] text-amber-600">crown</span>
                          )}
                          <span>{ws.name}</span>
                          {ws.role && <span className="text-[10px] opacity-75 font-normal">({ws.role})</span>}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-lg px-lg text-on-surface-variant">{user.lastLogin}</td>
                  <td className="py-lg px-lg text-right">
                    <button
                      onClick={() => setSelectedUserForManage(user)}
                      className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-primary hover:text-on-primary transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="w-full flex items-center justify-between p-md bg-surface-container-low border-t border-border-subtle">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Showing {startIndex} to {endIndex} of {totalItems} entries
          </span>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className={`px-md py-xs font-label-bold text-label-bold rounded-lg shadow-sm transition-colors ${
                safeCurrentPage <= 1
                  ? 'bg-surface text-on-surface-variant opacity-50 cursor-not-allowed'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high cursor-pointer'
              }`}
            >
              Previous
            </button>
            <span className="font-label-sm text-on-surface-variant px-xs">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className={`px-md py-xs font-label-bold text-label-bold rounded-lg shadow-sm transition-colors ${
                safeCurrentPage >= totalPages
                  ? 'bg-surface text-on-surface-variant opacity-50 cursor-not-allowed'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high cursor-pointer'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 1. Create & Invite User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        existingUsers={users}
        onClose={() => setIsCreateModalOpen(false)}
        onInvite={handleInviteUser}
      />

      {/* 2. User Invited Successfully Modal */}
      <InviteSuccessModal
        isOpen={Boolean(inviteSuccessData)}
        inviteData={inviteSuccessData}
        onClose={() => setInviteSuccessData(null)}
        onInviteAnother={() => {
          setInviteSuccessData(null);
          setIsCreateModalOpen(true);
        }}
      />

      {/* 3. Manage User Modal */}
      {selectedUserForManage && (
        <ManageUserModal
          key={selectedUserForManage.id}
          isOpen={Boolean(selectedUserForManage)}
          user={selectedUserForManage}
          onClose={() => setSelectedUserForManage(null)}
          onSaveUser={handleSaveManagedUser}
        />
      )}
    </div>
  );
}
