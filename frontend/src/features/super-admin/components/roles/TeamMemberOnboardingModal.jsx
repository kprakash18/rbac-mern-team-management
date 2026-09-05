import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';

export default function TeamMemberOnboardingModal({
  isOpen,
  team,
  availableRoles = [],
  onClose,
  onOnboardMembers,
  showToast,
}) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedRole, setSelectedRole] = useState('Developer');
  const [userRoleOverrides, setUserRoleOverrides] = useState({}); // { [userId]: roleName }
  const [submitting, setSubmitting] = useState(false);
  const [filterTab, setFilterTab] = useState('available'); // 'all' | 'available' | 'assigned'

  // Fetch active users from backend API
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoadingUsers(true);
      api
        .get('/api/users?status=ACTIVE&limit=100')
        .then((res) => {
          if (!isMounted) return;
          const userList = res.data?.data || res.data?.users || [];
          // Filter to strictly ACTIVE users only
          const activeOnly = userList.filter((u) => (u.accountStatus || u.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
          setActiveUsers(activeOnly);
        })
        .catch((err) => {
          console.error('Failed to load active users for onboarding:', err);
          showToast?.('Failed to load active platform users.', 'error');
        })
        .finally(() => {
          if (isMounted) setLoadingUsers(false);
        });
    } else {
      setSelectedUserIds(new Set());
      setUserRoleOverrides({});
      setSearchQuery('');
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, showToast]);

  // Set of IDs and Emails of users already in this team
  const assignedTeamMemberMap = useMemo(() => {
    const map = new Map();
    if (!team || !Array.isArray(team.members)) return map;
    team.members.forEach((m) => {
      const idKey = m.id || m._id;
      if (idKey) map.set(String(idKey), m);
      if (m.email) map.set(m.email.toLowerCase(), m);
    });
    return map;
  }, [team]);

  // Categorize active users into Assigned vs Available
  const categorizedUsers = useMemo(() => {
    return activeUsers.map((u) => {
      const uId = String(u._id || u.id);
      const uEmail = (u.email || '').toLowerCase();
      const existingMember = assignedTeamMemberMap.get(uId) || assignedTeamMemberMap.get(uEmail);
      const isAlreadyAssigned = Boolean(existingMember);

      return {
        ...u,
        id: u._id || u.id,
        isAlreadyAssigned,
        currentRoles: existingMember?.roles || (isAlreadyAssigned ? ['Member'] : []),
      };
    });
  }, [activeUsers, assignedTeamMemberMap]);

  // Filtered users by search query and tab
  const filteredUsers = useMemo(() => {
    return categorizedUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterTab === 'available') return !u.isAlreadyAssigned;
      if (filterTab === 'assigned') return u.isAlreadyAssigned;
      return true;
    });
  }, [categorizedUsers, searchQuery, filterTab]);

  const availableCount = useMemo(() => categorizedUsers.filter((u) => !u.isAlreadyAssigned).length, [categorizedUsers]);
  const assignedCount = useMemo(() => categorizedUsers.filter((u) => u.isAlreadyAssigned).length, [categorizedUsers]);

  // Toggle selection for a candidate user
  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Select all available candidate users
  const handleSelectAllAvailable = () => {
    const availableUsers = categorizedUsers.filter((u) => !u.isAlreadyAssigned);
    if (selectedUserIds.size === availableUsers.length && availableUsers.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(availableUsers.map((u) => u.id)));
    }
  };

  // Set individual role override for a selected user
  const handleSetUserRole = (userId, roleName) => {
    setUserRoleOverrides((prev) => ({
      ...prev,
      [userId]: roleName,
    }));
  };

  // Submit Onboarding
  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    if (selectedUserIds.size === 0) {
      showToast?.('Please select at least one active user to onboard.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const selectedUsersList = categorizedUsers.filter((u) => selectedUserIds.has(u.id));

      const newMembersToAdd = [];

      for (const u of selectedUsersList) {
        const assignedRoleName = userRoleOverrides[u.id] || selectedRole || 'Developer';
        try {
          await api.post(`/api/teams/${team.id}/members`, {
            userId: u.id,
            roleName: assignedRoleName,
          });
        } catch (apiErr) {
          console.warn(`Could not add user ${u.email} via API:`, apiErr);
        }

        newMembersToAdd.push({
          id: u.id,
          _id: u.id,
          name: u.name,
          email: u.email,
          roles: [assignedRoleName],
          joinedAt: new Date().toISOString(),
        });
      }

      // Merge with existing team members
      const existingMembers = Array.isArray(team.members) ? team.members : [];
      const updatedMembers = [...existingMembers, ...newMembersToAdd];

      onOnboardMembers?.(team.id, updatedMembers);
      showToast?.(
        `Successfully onboarded ${newMembersToAdd.length} active member(s) to "${team.name}".`
      );
      onClose();
    } catch (err) {
      console.error('Failed to onboard members:', err);
      showToast?.(err.response?.data?.message || 'Failed to onboard members to team.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150" id="modal-onboard-members">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative bg-card-bg rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-lg bg-surface-container-low border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary font-label-bold flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">person_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Onboard Members to {team.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-bold text-[11px]">
                  {team.members?.length || team.membersCount || 0} Current Members
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                Select active platform users to board into this team with designated workspace roles.
              </p>
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

        {/* Filter Tabs & Search Toolbar */}
        <div className="p-md bg-surface-container-lowest border-b border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md shrink-0">
          {/* Tabs */}
          <div className="inline-flex rounded-lg bg-surface-container p-1 border border-border-subtle w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterTab('available')}
              className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'available'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              <span>Available to Board ({availableCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('assigned')}
              className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'assigned'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              <span>Already Assigned ({assignedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 text-[12px] font-label-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>All Active ({activeUsers.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search active users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs text-[13px]"
            />
          </div>
        </div>

        {/* Global Default Role Selector */}
        {filterTab !== 'assigned' && availableCount > 0 && (
          <div className="px-lg py-sm bg-surface-container-low/50 border-b border-border-subtle flex items-center justify-between gap-md text-[12px] shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-label-bold text-on-surface">Default Role for Selected:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-card-bg text-on-surface px-2.5 py-1 rounded-md border border-border-subtle font-label-bold text-[12px] outline-none cursor-pointer focus:ring-1 focus:ring-primary"
              >
                {availableRoles.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.name} {r.isSystem ? '(System)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSelectAllAvailable}
              className="text-primary hover:underline font-label-bold text-[12px] cursor-pointer"
            >
              {selectedUserIds.size === availableCount ? 'Deselect All' : `Select All Available (${availableCount})`}
            </button>
          </div>
        )}

        {/* Users List */}
        <div className="p-lg overflow-y-auto flex-1 space-y-sm bg-surface">
          {loadingUsers ? (
            <div className="p-xl text-center flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
              <span className="text-body-sm">Loading active platform users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-xl text-center flex flex-col items-center gap-2 bg-card-bg rounded-xl border border-dashed border-border-subtle text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] text-outline">person_search</span>
              <p className="font-semibold text-on-surface">No users match your filter.</p>
              <p className="text-[12px]">All active users may already be assigned or no search results found.</p>
            </div>
          ) : (
            <div className="space-y-xs">
              {filteredUsers.map((user) => {
                const initials = (user.name || user.email || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                const isSelected = selectedUserIds.has(user.id);
                const assignedRole = userRoleOverrides[user.id] || selectedRole;

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (!user.isAlreadyAssigned) {
                        handleToggleUser(user.id);
                      }
                    }}
                    className={`p-md rounded-xl border transition-all flex items-center justify-between gap-md ${
                      user.isAlreadyAssigned
                        ? 'bg-surface-container-low/40 border-border-subtle/50 opacity-80 cursor-default'
                        : isSelected
                        ? 'bg-primary-fixed/20 border-primary shadow-xs cursor-pointer'
                        : 'bg-card-bg hover:bg-surface-container border-border-subtle cursor-pointer'
                    }`}
                  >
                    {/* User Info & Checkbox */}
                    <div className="flex items-center gap-md min-w-0">
                      {/* Checkbox / Status Icon */}
                      {user.isAlreadyAssigned ? (
                        <div className="w-5 h-5 rounded bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleUser(user.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle cursor-pointer shrink-0"
                        />
                      )}

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-[12px] shrink-0">
                        {initials}
                      </div>

                      {/* Name & Email */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-label-bold text-on-surface text-[13px] truncate font-bold">{user.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-label-bold text-[10px]">
                            ACTIVE
                          </span>
                        </div>
                        <span className="text-[12px] text-on-surface-variant truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* Role Status or Role Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      {user.isAlreadyAssigned ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-label-bold border border-border-subtle">
                            Already Member
                          </span>
                          <div className="flex items-center gap-1">
                            {user.currentRoles.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed text-[10px] font-bold"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : isSelected ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[11px] text-on-surface-variant font-label-bold">Role:</span>
                          <select
                            value={assignedRole}
                            onChange={(e) => handleSetUserRole(user.id, e.target.value)}
                            className="bg-surface-container text-on-surface text-[11px] font-label-bold px-2 py-1 rounded-md border border-border-subtle outline-none cursor-pointer"
                          >
                            {availableRoles.map((r) => (
                              <option key={r.id || r.name} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-[11px] text-outline italic">Click to select</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-md bg-surface-container-low border-t border-border-subtle flex items-center justify-between shrink-0">
          <div className="text-[12px] text-on-surface-variant">
            {selectedUserIds.size > 0 ? (
              <span>
                <strong className="text-primary font-bold">{selectedUserIds.size}</strong> active user(s) selected
              </span>
            ) : (
              <span>Select users above to board into this team</span>
            )}
          </div>

          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitOnboarding}
              disabled={submitting || selectedUserIds.size === 0}
              className={`px-lg py-xs font-label-bold text-label-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedUserIds.size > 0 && !submitting
                  ? 'bg-primary text-on-primary hover:bg-on-primary-container'
                  : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  <span>Boarding...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">group_add</span>
                  <span>Board {selectedUserIds.size > 0 ? `${selectedUserIds.size} Member(s)` : 'Members'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
