import { useState, useEffect, useCallback } from 'react';
import InviteTeamMemberModal from './InviteTeamMemberModal';
import ManageMemberRoleModal from './ManageMemberRoleModal';
import api from '../../../../lib/api';
import { useApp } from '@/context/useApp';
import { setStorage } from '@/lib/storage';
import { useToast } from '../../../../lib/useToast';
import ConfirmModal from '../../../../components/shared/ConfirmModal';
import Toast from '../../../../components/shared/Toast';
import SearchInput from '../../../../components/shared/SearchInput';

const ROLES_FILTER_OPTIONS = [
  'All Roles',
  'Team Admin',
  'Developer',
  'Viewer',
  'Security Auditor',
];

export default function TeamMembersView({ currentUser, workspace, onOpenDirectMessage }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);

  const [activeMainTab, setActiveMainTab] = useState('members'); // 'members' | 'invitations'
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [confirmRevokeInvite, setConfirmRevokeInvite] = useState(null);
  const [confirmRemovalMember, setConfirmRemovalMember] = useState(null);
  const [confirmSuspendMember, setConfirmSuspendMember] = useState(null);
  const [toast, showToast] = useToast();

  const fetchMembersAndInvitations = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.allSettled([
        api.get(`/api/teams/${teamId}/members`),
        api.get(`/api/teams/${teamId}/invitations`),
      ]);

      if (membersRes.status === 'fulfilled') {
        const rawMembers = membersRes.value.data?.data?.members || membersRes.value.data?.data || [];
        const formatted = rawMembers.map((m) => {
          const userObj = m.user || m.userId || {};
          const name = userObj.name || m.name || 'Member';
          const roleName = m.roles?.[0]?.name || m.role?.name || m.role || 'Member';
          return {
            id: m._id || m.id,
            membershipId: m._id || m.id,
            userId: userObj._id || userObj.id || m.userId,
            name,
            email: userObj.email || m.email || '',
            role: roleName,
            teamRole: roleName,
            department: m.department || 'Engineering',
            status: m.status === 'ACTIVE' ? 'Active' : m.status === 'SUSPENDED' ? 'Suspended' : m.status || 'Active',
            joinedDate: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active',
            initials: name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            avatarBgColor: 'bg-primary',
            avatarTextColor: 'text-on-primary',
            ...m,
          };
        });
        setMembers(formatted);
      }

      if (invitesRes.status === 'fulfilled') {
        const rawInvites = invitesRes.value.data?.data?.invitations || invitesRes.value.data?.data || [];
        setPendingInvitations(
          rawInvites.map((inv) => ({
            id: inv._id || inv.id,
            email: inv.email,
            name: inv.email.split('@')[0],
            role: inv.roleIds?.[0]?.name || 'Invited Member',
            department: 'Engineering',
            invitedBy: inv.invitedBy?.name || 'Admin',
            sentDate: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Recent',
            expiresDate: inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '1 hour',
            status: inv.status === 'PENDING' ? 'Pending Acceptance' : inv.status,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchMembersAndInvitations();
  }, [fetchMembersAndInvitations]);

  const handleOpenMember = (member) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  const handleToggleSuspendMember = async (memberId) => {
    const target = members.find((m) => m.id === memberId || m.membershipId === memberId);
    if (!target || !teamId) return;

    const action = target.status === 'Suspended' ? 'reactivate' : 'suspend';
    const mId = target.membershipId || target.id;
    try {
      await api.patch(`/api/teams/${teamId}/members/${mId}/${action}`);
      const newStatus = action === 'reactivate' ? 'Active' : 'Suspended';
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId || m.membershipId === memberId ? { ...m, status: newStatus } : m))
      );
      if (selectedMember?.id === memberId) {
        setSelectedMember((prev) => ({ ...prev, status: newStatus }));
      }
      showToast(`Member status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update member status.', 'error');
    }
  };

  const handleConfirmRemoveMember = async (memberId) => {
    const target = members.find((m) => m.id === memberId || m.membershipId === memberId);
    if (!target || !teamId) return;
    const mId = target.membershipId || target.id;

    try {
      await api.delete(`/api/teams/${teamId}/members/${mId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId && m.membershipId !== memberId));
      setConfirmRemovalMember(null);
      setIsDrawerOpen(false);
      setSelectedMember(null);
      showToast('Member was removed from the workspace.');
    } catch (err) {
      console.error('Failed to remove member:', err);
      showToast(err.response?.data?.error?.message || 'Failed to remove member.', 'error');
    }
  };

  const [roleEditingMember, setRoleEditingMember] = useState(null);

  const handleSaveMemberRole = (updatedMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    if (selectedMember?.id === updatedMember.id) {
      setSelectedMember(updatedMember);
    }
    setRoleEditingMember(null);
    showToast(`Role updated for ${updatedMember.name}.`);
    fetchMembersAndInvitations();
  };

  const handleConfirmRevokeInvite = (inviteId) => {
    setPendingInvitations((prev) => {
      const next = prev.filter((inv) => inv.id !== inviteId);
      setStorage('workspace_pending_invitations', next);
      return next;
    });
    setConfirmRevokeInvite(null);
    showToast('Invitation successfully revoked.');
  };

  const handleCreateInvite = ({ name, email, role, department }) => {
    const newInv = {
      id: `inv-${Date.now()}`,
      name: name.trim() || 'Invited Teammate',
      email: email.trim(),
      role: role || 'Developer',
      department: department || 'Engineering',
      invitedBy: currentUser?.name || 'Diana Morales',
      sentDate: 'Just now',
      expiresDate: 'In 48 hours',
      status: 'Pending Acceptance',
    };

    setPendingInvitations((prev) => {
      const nextList = [newInv, ...prev];
      setStorage('workspace_pending_invitations', nextList);
      return nextList;
    });
    setIsInviteModalOpen(false);
    setActiveMainTab('invitations');
    showToast(`Invitation dispatched to ${email}.`);
  };

  const filteredMembers = members.filter((member) => {
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

  const filteredInvitations = pendingInvitations.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.email.toLowerCase().includes(q) ||
      inv.name.toLowerCase().includes(q) ||
      inv.role.toLowerCase().includes(q) ||
      inv.department.toLowerCase().includes(q)
    );
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
            {members.length} active team members in Acme Engineering
          </p>
        </div>

        <div className="flex items-center gap-sm">
          {isTeamAdmin ? (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
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

      {/* Toast Notification */}
      <Toast message={toast?.msg} type={toast?.type} />

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-label-sm font-label-bold transition-colors cursor-pointer ${
            activeMainTab === 'members'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>Active Members</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeMainTab === 'members'
                ? 'bg-on-primary/20 text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('invitations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-label-sm font-label-bold transition-colors cursor-pointer ${
            activeMainTab === 'invitations'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">mail</span>
          <span>Pending Invitations</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeMainTab === 'invitations'
                ? 'bg-on-primary/20 text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {pendingInvitations.length}
          </span>
        </button>
      </div>

      {activeMainTab === 'invitations' ? (
        <div className="flex flex-col gap-md animate-in fade-in duration-150">
          {/* Search bar for invitations */}
          <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search invitations by email, name, or role..."
              className="flex-1 max-w-md"
            />
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-on-surface-variant text-[12px] hidden sm:inline">
                Showing {filteredInvitations.length} of {pendingInvitations.length} invitations
              </span>
              {isTeamAdmin && (
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-bold text-label-sm flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Invite</span>
                </button>
              )}
            </div>
          </div>

          {/* Invitations Table */}
          <div className="w-full rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle text-on-surface-variant font-label-bold text-label-sm">
                  <th className="py-3 px-4">Invited Member</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Invited By</th>
                  <th className="py-3 px-4">Status &amp; Expiry</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-on-surface-variant/60">
                          forward_to_inbox
                        </span>
                        <p className="font-medium text-body-base">No pending invitations</p>
                        <p className="text-[12px] text-on-surface-variant">
                          All invited members have accepted or no invitations match your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface font-label-bold flex items-center justify-center text-[12px]">
                            {inv.name ? inv.name[0].toUpperCase() : 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-bold text-on-surface">{inv.name}</span>
                            <span className="text-[12px] text-on-surface-variant font-mono">{inv.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[12px] font-medium">
                          {inv.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{inv.department}</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{inv.invitedBy}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-warning-text font-label-bold text-[12px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning-text"></span>
                            {inv.status}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">{inv.expiresDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isTeamAdmin ? (
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeInvite(inv)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-error/30 text-error hover:bg-error-container/40 text-label-sm font-label-bold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            <span>Revoke</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant italic">Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Clean Filter & Search Bar */}
      <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search by name, email, or role..."
            className="flex-1 min-w-50 max-w-md"
          />

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
            {['All', 'Active', 'Suspended', 'On-Call'].map((tab) => (
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

      {/* Members Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-border-subtle">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
          <span className="text-[13px] font-medium">Loading team members...</span>
        </div>
      ) : viewMode === 'grid' ? (
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
                        : member.status === 'Suspended'
                        ? 'bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
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
                    {isTeamAdmin && member.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoleEditingMember(member);
                        }}
                        className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                        title={`Change role for ${member.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </button>
                    )}
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
                            : member.status === 'Suspended'
                            ? 'bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                            : 'bg-warning-bg text-warning-text'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-[12px]">{member.joinedDate}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isTeamAdmin && member.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleEditingMember(member);
                            }}
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                            title={`Change role for ${member.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">badge</span>
                          </button>
                        )}
                        {isTeamAdmin && member.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmSuspendMember(member);
                            }}
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              member.status === 'Suspended'
                                ? 'text-success-text hover:bg-success-bg/40'
                                : 'text-on-surface-variant hover:text-warning-text hover:bg-surface-container'
                            }`}
                            title={member.status === 'Suspended' ? `Reactivate ${member.name}` : `Suspend ${member.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {member.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
                            </span>
                          </button>
                        )}
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
        </>
      )}

      {/* Clean Member Profile Slide-over Drawer */}
      {isDrawerOpen && selectedMember && (
        <>
          <div
            className="fixed inset-0 bg-on-surface/20 backdrop-blur-[1px] z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          <aside className="fixed top-0 right-0 w-full sm:w-105 h-screen bg-surface-container-lowest border-l border-border-subtle shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
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

                {/* Team Admin Actions */}
                {isTeamAdmin && selectedMember.id !== currentUserId && (
                  <div className="flex flex-col gap-2.5 pt-md border-t border-border-subtle">
                    <h4 className="text-label-bold text-label-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">admin_panel_settings</span>
                      <span>Team Admin Actions</span>
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setRoleEditingMember(selectedMember)}
                        className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-label-sm font-label-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                        <span>Change Member Role</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSuspendMember(selectedMember.id)}
                        className={`w-full py-2 px-3 rounded-lg text-label-sm font-label-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                          selectedMember.status === 'Suspended'
                            ? 'bg-success-bg text-success-text border-success-text/30 hover:bg-success-bg/80'
                            : 'bg-warning-bg/40 text-warning-text border-warning-text/30 hover:bg-warning-bg/70'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {selectedMember.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
                        </span>
                        <span>
                          {selectedMember.status === 'Suspended' ? 'Reactivate Member' : 'Suspend Member Access'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmRemovalMember(selectedMember)}
                        className="w-full py-2 px-3 rounded-lg bg-error-container/30 hover:bg-error-container/60 text-error border border-error/30 text-label-sm font-label-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        <span>Remove from Workspace</span>
                      </button>
                    </div>
                  </div>
                )}
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
                  onClick={() => setRoleEditingMember(selectedMember)}
                  className="px-md py-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">badge</span>
                  <span>Manage Role</span>
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Confirm Revoke Invite Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmRevokeInvite)}
        title="Revoke Invitation?"
        description={`Are you sure you want to revoke the invitation for ${confirmRevokeInvite?.email}? The invitation link will immediately expire and be invalidated.`}
        confirmText="Yes, Revoke Invitation"
        cancelText="Keep Active"
        confirmVariant="danger"
        icon="cancel"
        onConfirm={() => handleConfirmRevokeInvite(confirmRevokeInvite.id)}
        onClose={() => setConfirmRevokeInvite(null)}
      />

      {/* Confirm Removal Member Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmRemovalMember)}
        title={`Remove ${confirmRemovalMember?.name}?`}
        description={`Are you sure you want to remove ${confirmRemovalMember?.name} from this workspace? They will immediately lose access to all tasks, channels, and team resources.`}
        confirmText="Yes, Remove Member"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="warning"
        onConfirm={() => handleConfirmRemoveMember(confirmRemovalMember.id)}
        onClose={() => setConfirmRemovalMember(null)}
      />

      {/* Confirm Suspend / Reactivate Member Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmSuspendMember)}
        title={confirmSuspendMember?.status === 'Suspended' ? `Reactivate ${confirmSuspendMember?.name}?` : `Suspend ${confirmSuspendMember?.name}?`}
        description={
          confirmSuspendMember?.status === 'Suspended'
            ? `This will reactivate ${confirmSuspendMember?.name}'s membership, restoring their permissions and access to workspace tasks, team channels, and access requests.`
            : `Are you sure you want to suspend ${confirmSuspendMember?.name}? While suspended, the member's account access is temporarily frozen and they cannot perform any mutations or access sensitive resources.`
        }
        confirmText={confirmSuspendMember?.status === 'Suspended' ? 'Yes, Reactivate Member' : 'Yes, Suspend Access'}
        cancelText="Cancel"
        confirmVariant={confirmSuspendMember?.status === 'Suspended' ? 'primary' : 'warning'}
        icon={confirmSuspendMember?.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
        onConfirm={() => {
          handleToggleSuspendMember(confirmSuspendMember.id);
          setConfirmSuspendMember(null);
        }}
        onClose={() => setConfirmSuspendMember(null)}
      />

      {/* Invite Member Modal */}
      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleCreateInvite}
      />

      {/* Manage Member Role Modal */}
      {roleEditingMember && (
        <ManageMemberRoleModal
          isOpen={Boolean(roleEditingMember)}
          member={roleEditingMember}
          onClose={() => setRoleEditingMember(null)}
          onSaveRole={handleSaveMemberRole}
        />
      )}
    </div>
  );
}
