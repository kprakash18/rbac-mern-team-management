import { useState, useEffect, useCallback } from 'react';
import CreateUserModal from './CreateUserModal';
import InviteSuccessModal from './InviteSuccessModal';
import ManageUserModal from './ManageUserModal';
import { Pagination } from '@/shared/components';
import api from '@/lib/api';

export default function UsersAccessView() {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inviteSuccessData, setInviteSuccessData] = useState(null);
  const [selectedUserForManage, setSelectedUserForManage] = useState(null);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));

      if (activeFilter && activeFilter !== 'All') {
        params.set('status', activeFilter.toUpperCase());
      }
      if (debouncedSearch) {
        params.set('q', debouncedSearch);
      }

      const res = await api.get(`/api/users?${params.toString()}`);
      const backendUsers = res.data?.data || res.data?.users || [];
      const pagination = res.data?.pagination || {};

      setTotalCount(pagination.total || backendUsers.length || 0);
      setTotalPages(Math.max(1, pagination.totalPages || Math.ceil((pagination.total || 0) / pageSize) || 1));

      if (Array.isArray(backendUsers)) {
        const mapped = backendUsers.map((u) => {
          const statusLower = (u.accountStatus || u.status || 'ACTIVE').toLowerCase();
          return {
            id: u._id || u.id,
            name: u.name || u.email,
            email: u.email,
            status:
              statusLower === 'active'
                ? 'Active'
                : statusLower === 'disabled'
                ? 'Disabled'
                : statusLower === 'suspended'
                ? 'Suspended'
                : statusLower === 'invited'
                ? 'Invited'
                : 'Active',
            statusType: statusLower,
            workspaces: u.workspaces || [],
            lastLogin:
              u.lastLogin ||
              (u.createdAt
                ? new Date(u.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recently'),
            avatar: u.avatar || '',
            initials: u.name
              ? u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'U',
            isSuperAdmin: Boolean(u.isSuperAdmin),
            isTeamAdmin: Boolean(u.isTeamAdmin),
            mustChangePassword: Boolean(u.mustChangePassword),
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      console.warn('Backend users unavailable:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeFilter, debouncedSearch, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filterTabs = ['All', 'Active', 'Invited', 'Suspended', 'Disabled'];

  const handleFilterChange = (tab) => {
    setActiveFilter(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSaveManagedUser = async (updatedUser) => {
    try {
      setLoading(true);
      await api.put(`/api/users/${updatedUser.id}`, {
        name: updatedUser.name,
        accountStatus: (updatedUser.status || updatedUser.statusType || 'ACTIVE').toUpperCase(),
        mustChangePassword: Boolean(updatedUser.mustChangePassword),
        lastLogoutAt: updatedUser.lastLogoutAt,
        workspaces: updatedUser.workspaces || [],
      });
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user on backend:', err);
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    } finally {
      setLoading(false);
    }

    try {
      const currentSession = JSON.parse(localStorage.getItem('auth_session') || '{}');
      if (currentSession.email && currentSession.email.toLowerCase() === updatedUser.email.toLowerCase()) {
        currentSession.mustChangePassword = Boolean(updatedUser.mustChangePassword);
        currentSession.status = updatedUser.status;
        currentSession.accountStatus = (updatedUser.status || 'ACTIVE').toUpperCase();
        localStorage.setItem('auth_session', JSON.stringify(currentSession));
      }
    } catch {
    }
  };

  const handleInviteUser = async (newUserData) => {
    let generatedInviteLink = `${window.location.origin}/`;
    let isDirectAssignment = false;

    try {
      const [teamsRes, rolesRes] = await Promise.allSettled([
        api.get('/api/teams?status=ACTIVE'),
        api.get('/api/roles?status=all'),
      ]);

      const teamsList = teamsRes.status === 'fulfilled' ? (teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || []) : [];
      const rolesList = rolesRes.status === 'fulfilled' ? (rolesRes.value.data?.data?.roles || rolesRes.value.data?.data || []) : [];

      const targetTeamId = newUserData.teamId || newUserData.assignments?.[0]?.teamId;
      const targetTeamName = newUserData.workspace || newUserData.assignments?.[0]?.workspace;
      const targetRoleId = newUserData.roleId || newUserData.assignments?.[0]?.roleId;
      const targetRoleName = newUserData.role || newUserData.assignments?.[0]?.role;

      const matchedTeam =
        (targetTeamId && teamsList.find((t) => String(t._id || t.id) === String(targetTeamId))) ||
        teamsList.find((t) => t.name?.toLowerCase() === targetTeamName?.toLowerCase()) ||
        (targetTeamId ? { _id: targetTeamId, name: targetTeamName } : teamsList[0]);

      const matchedRole =
        (targetRoleId && rolesList.find((r) => String(r._id || r.id) === String(targetRoleId))) ||
        rolesList.find((r) => r.name?.toLowerCase() === targetRoleName?.toLowerCase()) ||
        (targetRoleId ? { _id: targetRoleId, name: targetRoleName } : rolesList[0]);

      if (matchedTeam) {
        const teamId = matchedTeam._id || matchedTeam.id;
        const roleIds = matchedRole ? [matchedRole._id || matchedRole.id] : [];
        const res = await api.post(`/api/teams/${teamId}/invitations`, {
          email: newUserData.email.trim(),
          roleIds,
        });

        isDirectAssignment = Boolean(res.data?.data?.isDirectAssignment);

        if (isDirectAssignment) {
          generatedInviteLink = `${window.location.origin}/`;
        } else if (res.data?.data?.inviteLink) {
          generatedInviteLink = res.data.data.inviteLink;
        } else if (res.data?.data?.rawToken || res.data?.data?.token) {
          generatedInviteLink = `${window.location.origin}/invite?token=${res.data.data.rawToken || res.data.data.token}`;
        }
      }
    } catch (err) {
      console.warn('Invitation API warning:', err.response?.data?.message || err.message);
    }

    await fetchUsers();

    setInviteSuccessData({
      fullName: newUserData.fullName || newUserData.name,
      email: newUserData.email,
      assignments: newUserData.assignments || [{ workspace: newUserData.workspace, role: newUserData.role }],
      workspace: newUserData.workspace,
      role: newUserData.role,
      inviteLink: generatedInviteLink,
      isDirectAssignment,
    });
  };

  return (
    <div className="flex flex-col w-full h-full max-w-7xl mx-auto px-lg py-xl space-y-xl">
      <div className="flex flex-col space-y-xs">
        <h1 className="font-display-title text-display-title text-on-surface">Users &amp; Access</h1>
        <p className="font-body-base text-body-base text-on-surface-variant">Global identity and access management.</p>
      </div>

      <div className="filter-toolbar">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-surface border border-border-subtle rounded-lg pl-10 pr-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
            placeholder="Search users by name or email..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-xs flex-wrap">
          <div className="tab-group">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                className={`tab-item ${
                  activeFilter === tab ? 'tab-item-active' : 'tab-item-inactive'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-sm px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            &nbsp;Create User
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="table-head-row">
                <th className="py-3.5 px-4 font-semibold border-b border-border-subtle min-w-[240px]">User</th>
                <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-36">Account Status</th>
                <th className="py-3.5 px-4 font-semibold border-b border-border-subtle min-w-[220px]">Teams &amp; Workspaces</th>
                <th className="py-3.5 px-4 font-semibold border-b border-border-subtle w-32">Last Login</th>
                <th className="py-3.5 px-4 font-semibold border-b border-border-subtle text-right w-24">Actions</th>
              </tr>
            </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-xl px-lg text-center text-on-surface-variant">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    <span>Loading platform users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-xl px-lg text-center text-on-surface-variant">
                  No users found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
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
                      <span className="inline-flex items-center px-sm py-0.5 rounded-full bg-success-bg text-success-text font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-text mr-xs"></span>Active
                      </span>
                    )}
                    {user.statusType === 'invited' && (
                      <span className="inline-flex items-center px-sm py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline mr-xs"></span>Invited
                      </span>
                    )}
                    {user.statusType === 'suspended' && (
                      <span className="inline-flex items-center px-sm py-0.5 rounded-full bg-warning-bg text-warning-text font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning-text mr-xs"></span>Suspended
                      </span>
                    )}
                    {user.statusType === 'disabled' && (
                      <span className="inline-flex items-center px-sm py-0.5 rounded-full bg-error-bg text-error-text font-label-sm text-label-sm shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-error-text mr-xs"></span>Disabled
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
                  <td className="py-3.5 px-4 text-on-surface text-[12px] min-w-[220px]">
                    <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                      {user.workspaces?.length === 0 && <span className="text-on-surface-variant italic">No workspaces</span>}
                      {user.workspaces?.map((w, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high border border-border-subtle text-[11px] font-medium"
                        >
                          <span className="font-semibold">{w.name}</span>
                          <span className="text-on-surface-variant">({w.role || 'Member'})</span>
                          {w.isTeamAdmin && (
                            <span className="material-symbols-outlined text-[13px] text-amber-600" title="Team Admin">
                              shield_person
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">{user.lastLogin}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedUserForManage(user)}
                      className="px-3 py-1 bg-surface-container-high text-on-surface font-label-bold text-[12px] rounded-lg shadow-2xs hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={totalCount}
          limit={pageSize}
          itemLabel="users"
          loading={loading}
          onPageChange={(p) => setCurrentPage(p)}
          className="rounded-t-none border-t-0"
        />
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        existingUsers={users}
        onClose={() => setIsCreateModalOpen(false)}
        onInvite={handleInviteUser}
      />

      <InviteSuccessModal
        isOpen={Boolean(inviteSuccessData)}
        inviteData={inviteSuccessData}
        onClose={() => setInviteSuccessData(null)}
        onInviteAnother={() => {
          setInviteSuccessData(null);
          setIsCreateModalOpen(true);
        }}
      />

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
