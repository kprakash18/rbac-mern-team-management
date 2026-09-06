import { useState, useEffect, useCallback } from 'react';
import InviteTeamMemberModal from './InviteTeamMemberModal';
import ManageMemberRoleModal from './ManageMemberRoleModal';
import api from '@/lib/api';
import { useApp } from '@/context/useApp';
import { useToast } from '@/lib/useToast';
import { ConfirmModal, Toast, SearchInput, Button, Badge, Avatar } from '@/shared/components';

const ROLES_FILTER = ['All Roles', 'Team Admin', 'Developer', 'Viewer', 'Security Auditor'];
const STATUS_TABS = ['All', 'Active', 'Suspended'];

export default function TeamMembersView({ currentUser, workspace, onOpenDirectMessage }) {
  const { activeWorkspace, hasPermission: hasPermissionContext } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);

  const hasPermission = useCallback(
    (perm) => {
      if (isTeamAdmin || currentUser?.isSuperAdmin) return true;
      if (typeof currentUser?.hasPermission === 'function') return currentUser.hasPermission(perm);
      if (typeof hasPermissionContext === 'function') return hasPermissionContext(perm);
      return (currentUser?.permissions || []).includes(perm);
    },
    [currentUser, hasPermissionContext, isTeamAdmin]
  );

  const canInvite = isTeamAdmin || hasPermission('invitation.create') || hasPermission('membership.create');
  const canRevokeInvite = isTeamAdmin || hasPermission('invitation.revoke');
  const canAssignRole = isTeamAdmin || hasPermission('role.assign');
  const canManageMembership = isTeamAdmin || hasPermission('membership.update');
  const canRemoveMember = isTeamAdmin || hasPermission('membership.remove');

  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [confirmRevokeInvite, setConfirmRevokeInvite] = useState(null);
  const [confirmRemovalMember, setConfirmRemovalMember] = useState(null);
  const [confirmSuspendMember, setConfirmSuspendMember] = useState(null);
  const [roleEditingMember, setRoleEditingMember] = useState(null);
  const [toast, showToast] = useToast();

  const fetchMembersAndInvitations = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.allSettled([
        api.get(`/api/teams/${teamId}/members?limit=100`),
        api.get(`/api/teams/${teamId}/invitations`),
      ]);

      if (membersRes.status === 'fulfilled') {
        const raw = membersRes.value.data?.data?.members || membersRes.value.data?.data || [];
        setMembers(
          raw.map((m) => {
            const u = m.user || m.userId || {};
            const name = u.name || m.name || 'Member';
            const roleName = m.roles?.[0]?.name || m.role?.name || m.role || 'Member';
            return {
              id: m._id || m.id,
              membershipId: m._id || m.id,
              userId: u._id || u.id || m.userId,
              name,
              email: u.email || m.email || '',
              role: roleName,
              teamRole: roleName,
              permissions: m.permissions || [],
              department: m.department || 'Engineering',
              status: m.status === 'ACTIVE' ? 'Active' : m.status === 'SUSPENDED' ? 'Suspended' : m.status || 'Active',
              joinedDate: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active',
              ...m,
            };
          })
        );
      }

      if (invitesRes.status === 'fulfilled') {
        const raw = invitesRes.value.data?.data?.invitations || invitesRes.value.data?.data || [];
        setPendingInvitations(
          raw.map((inv) => ({
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

  const handleToggleSuspendMember = async (memberId) => {
    const target = members.find((m) => m.id === memberId || m.membershipId === memberId);
    if (!target || !teamId) return;

    const isSuspended = target.status === 'Suspended' || target.status === 'SUSPENDED';
    const action = isSuspended ? 'reactivate' : 'suspend';
    const mId = target.membershipId || target.id;
    try {
      await api.patch(`/api/teams/${teamId}/members/${mId}/${action}`);
      const newStatus = action === 'reactivate' ? 'Active' : 'Suspended';
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId || m.membershipId === memberId ? { ...m, status: newStatus } : m))
      );
      if (selectedMember?.id === memberId) setSelectedMember((prev) => ({ ...prev, status: newStatus }));
      showToast(`Member status updated to ${newStatus}.`);
      fetchMembersAndInvitations();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update member status.', 'error');
    }
  };

  const handleConfirmRemoveMember = async (memberId) => {
    const target = members.find((m) => m.id === memberId || m.membershipId === memberId);
    if (!target || !teamId) return;
    try {
      await api.delete(`/api/teams/${teamId}/members/${target.membershipId || target.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId && m.membershipId !== memberId));
      setConfirmRemovalMember(null);
      setIsDrawerOpen(false);
      setSelectedMember(null);
      showToast('Member removed from the workspace.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to remove member.', 'error');
    }
  };

  const handleSaveMemberRole = (updatedMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    if (selectedMember?.id === updatedMember.id) setSelectedMember(updatedMember);
    setRoleEditingMember(null);
    showToast(`Role updated for ${updatedMember.name}.`);
    fetchMembersAndInvitations();
  };

  const handleConfirmRevokeInvite = async (inviteId) => {
    if (!teamId) return;
    try {
      await api.delete(`/api/teams/${teamId}/invitations/${inviteId}`);
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== inviteId));
      setConfirmRevokeInvite(null);
      showToast('Invitation revoked.');
      fetchMembersAndInvitations();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to revoke invitation.', 'error');
    }
  };

  const handleCreateInvite = async ({ email, role }) => {
    if (!teamId) return;
    try {
      const rolesRes = await api.get('/api/roles', { params: { teamId } });
      const rolesList = rolesRes.data?.data || [];
      const matched = rolesList.find((r) => r.name.toLowerCase() === (role || 'developer').toLowerCase());
      await api.post(`/api/teams/${teamId}/invitations`, {
        email: email.trim().toLowerCase(),
        roleIds: matched ? [matched._id] : [],
      });
      setIsInviteModalOpen(false);
      setActiveTab('invitations');
      showToast(`Invitation sent to ${email}.`);
      fetchMembersAndInvitations();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to send invitation.', 'error');
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchSearch =
      !searchQuery ||
      [m.name, m.email, m.role, m.department].some((f) => f?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchRole = selectedRole === 'All Roles' || m.role?.toLowerCase() === selectedRole.toLowerCase();
    const matchStatus = statusFilter === 'All' || m.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchRole && matchStatus;
  });

  const filteredInvitations = pendingInvitations.filter(
    (inv) =>
      !searchQuery ||
      [inv.email, inv.name, inv.role, inv.department].some((f) => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
            Team &amp; Members
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {members.length} active team members in workspace
          </p>
        </div>

        {canInvite ? (
          <Button icon="person_add" onClick={() => setIsInviteModalOpen(true)}>
            Invite Member
          </Button>
        ) : (
          <Button icon="lock" disabled title="Restricted">
            Invite Member
          </Button>
        )}
      </div>

      <Toast message={toast?.msg} type={toast?.type} />

      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-label-sm font-label-bold transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>Active Members</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'members' ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-label-sm font-label-bold transition-colors cursor-pointer ${
            activeTab === 'invitations'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">mail</span>
          <span>Pending Invitations</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'invitations' ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
            {pendingInvitations.length}
          </span>
        </button>
      </div>

      {activeTab === 'invitations' ? (
        <div className="flex flex-col gap-md animate-in fade-in duration-150">
          <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search invitations..."
              className="flex-1 max-w-md"
            />
            {canInvite && (
              <Button size="sm" icon="add" onClick={() => setIsInviteModalOpen(true)}>
                Invite
              </Button>
            )}
          </div>

          <div className="w-full rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle text-on-surface-variant font-label-bold text-label-sm">
                  <th className="py-3 px-4">Invited Member</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Invited By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                      No pending invitations
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={inv.name} size="sm" />
                          <div>
                            <span className="font-label-bold text-on-surface block">{inv.name}</span>
                            <span className="text-[12px] text-on-surface-variant font-mono">{inv.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4"><Badge variant="outline">{inv.role}</Badge></td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{inv.department}</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{inv.invitedBy}</td>
                      <td className="py-3.5 px-4"><Badge variant="warning">{inv.status}</Badge></td>
                      <td className="py-3.5 px-4 text-right">
                        {canRevokeInvite && (
                          <Button size="sm" variant="danger" icon="cancel" onClick={() => setConfirmRevokeInvite(inv)}>
                            Revoke
                          </Button>
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
          <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search by name, email, role..."
                className="flex-1 min-w-50 max-w-md"
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-label-sm bg-surface-container-low border border-border-subtle rounded-lg px-3 py-1.5 text-on-surface outline-none"
              >
                {ROLES_FILTER.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded-md text-label-sm cursor-pointer transition-colors ${
                      statusFilter === tab ? 'font-label-bold bg-surface-container-lowest text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center border border-border-subtle rounded-lg overflow-hidden bg-surface-container-low">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 cursor-pointer ${viewMode === 'grid' ? 'bg-surface-container-lowest text-on-surface' : 'text-on-surface-variant'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 cursor-pointer ${viewMode === 'table' ? 'bg-surface-container-lowest text-on-surface' : 'text-on-surface-variant'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-border-subtle">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px] block mb-2">progress_activity</span>
              <span>Loading team members...</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md w-full">
              {filteredMembers.map((m) => {
                const isUser = m.id === currentUserId;
                return (
                  <div
                    key={m.id}
                    onClick={() => { setSelectedMember(m); setIsDrawerOpen(true); }}
                    className={`p-lg rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-md cursor-pointer border ${
                      isUser ? 'border-2 border-primary/30' : 'border-border-subtle hover:border-outline'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Avatar name={m.name} size="md" status={m.status === 'Active' ? 'online' : 'offline'} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-label-bold text-on-surface truncate">{m.name}</h3>
                            {isUser && <Badge variant="primary">YOU</Badge>}
                          </div>
                          <p className="text-body-sm text-on-surface-variant truncate">{m.email}</p>
                        </div>
                      </div>
                      <Badge variant={m.teamRole === 'Team Admin' ? 'primary' : 'outline'}>{m.role}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border-subtle text-on-surface-variant">
                      <span className="truncate">{m.department}</span>
                      <Badge variant={m.status === 'Active' ? 'success' : 'neutral'}>{m.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70">
                      <span className="text-[11px] text-on-surface-variant">Joined {m.joinedDate}</span>
                      <div className="flex items-center gap-1">
                        {canAssignRole && m.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setRoleEditingMember(m); }}
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container"
                            title="Manage Role"
                          >
                            <span className="material-symbols-outlined text-[18px]">badge</span>
                          </button>
                        )}
                        {m.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onOpenDirectMessage?.(m); }}
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container"
                            title="Direct Message"
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
                  {filteredMembers.map((m) => {
                    const isUser = m.id === currentUserId;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => { setSelectedMember(m); setIsDrawerOpen(true); }}
                        className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={m.name} size="sm" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-label-bold text-on-surface">{m.name}</span>
                                {isUser && <Badge variant="primary">YOU</Badge>}
                              </div>
                              <span className="text-[12px] text-on-surface-variant block">{m.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4"><Badge variant="outline">{m.role}</Badge></td>
                        <td className="py-3 px-4 text-on-surface-variant">{m.department}</td>
                        <td className="py-3 px-4"><Badge variant={m.status === 'Active' ? 'success' : 'neutral'}>{m.status}</Badge></td>
                        <td className="py-3 px-4 text-on-surface-variant text-[12px]">{m.joinedDate}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canAssignRole && m.id !== currentUserId && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setRoleEditingMember(m); }}
                                className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container"
                              >
                                <span className="material-symbols-outlined text-[18px]">badge</span>
                              </button>
                            )}
                            {canManageMembership && m.id !== currentUserId && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setConfirmSuspendMember(m); }}
                                className="p-1 rounded text-on-surface-variant hover:text-warning-text hover:bg-surface-container"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {m.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
                                </span>
                              </button>
                            )}
                            {m.id !== currentUserId && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onOpenDirectMessage?.(m); }}
                                className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container"
                              >
                                <span className="material-symbols-outlined text-[18px]">chat</span>
                              </button>
                            )}
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

      {isDrawerOpen && selectedMember && (
        <>
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-[1px] z-40" onClick={() => setIsDrawerOpen(false)} />
          <aside className="fixed top-0 right-0 w-full sm:w-105 h-screen bg-surface-container-lowest border-l border-border-subtle shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-md border-b border-border-subtle flex items-center justify-between sticky top-0 bg-surface-container-lowest/95 backdrop-blur z-10">
                <h2 className="font-headline-md text-on-surface font-semibold">Member Details</h2>
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="p-md flex flex-col gap-lg">
                <div className="flex items-center gap-3.5 pb-md border-b border-border-subtle">
                  <Avatar name={selectedMember.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-md text-[18px] font-semibold text-on-surface">{selectedMember.name}</h3>
                      {selectedMember.id === currentUserId && <Badge variant="primary">YOU</Badge>}
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{selectedMember.email}</p>
                    <Badge variant="outline" className="mt-1">{selectedMember.role}</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <h4 className="text-label-bold text-on-surface">Overview</h4>
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
                      <Badge variant={selectedMember.status === 'Active' ? 'success' : 'neutral'}>{selectedMember.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                      <span className="text-on-surface-variant">Joined</span>
                      <span className="text-on-surface">{selectedMember.joinedDate}</span>
                    </div>
                  </div>
                </div>

                {(canAssignRole || canManageMembership || canRemoveMember) && selectedMember.id !== currentUserId && (
                  <div className="flex flex-col gap-2.5 pt-md border-t border-border-subtle">
                    <h4 className="text-label-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">admin_panel_settings</span>
                      <span>Management Actions</span>
                    </h4>
                    <div className="flex flex-col gap-2">
                      {canAssignRole && (
                        <Button variant="outline" icon="badge" onClick={() => setRoleEditingMember(selectedMember)}>
                          Change Member Role
                        </Button>
                      )}
                      {canManageMembership && (
                        <Button
                          variant="outline"
                          icon={selectedMember.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
                          onClick={() => handleToggleSuspendMember(selectedMember.id)}
                        >
                          {selectedMember.status === 'Suspended' ? 'Reactivate Member' : 'Suspend Member Access'}
                        </Button>
                      )}
                      {canRemoveMember && (
                        <Button variant="danger" icon="person_remove" onClick={() => setConfirmRemovalMember(selectedMember)}>
                          Remove from Workspace
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-md border-t border-border-subtle bg-surface-container-lowest flex items-center gap-2 sticky bottom-0">
              <Button
                className="flex-1"
                icon="chat"
                onClick={() => {
                  onOpenDirectMessage?.(selectedMember);
                  setIsDrawerOpen(false);
                }}
              >
                Send Message
              </Button>
            </div>
          </aside>
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmRevokeInvite)}
        title="Revoke Invitation?"
        description={`Are you sure you want to revoke the invitation for ${confirmRevokeInvite?.email}?`}
        confirmText="Yes, Revoke Invitation"
        confirmVariant="danger"
        icon="cancel"
        onConfirm={() => handleConfirmRevokeInvite(confirmRevokeInvite.id)}
        onClose={() => setConfirmRevokeInvite(null)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmRemovalMember)}
        title={`Remove ${confirmRemovalMember?.name}?`}
        description={`Are you sure you want to remove ${confirmRemovalMember?.name} from this workspace?`}
        confirmText="Yes, Remove Member"
        confirmVariant="danger"
        icon="warning"
        onConfirm={() => handleConfirmRemoveMember(confirmRemovalMember.id)}
        onClose={() => setConfirmRemovalMember(null)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmSuspendMember)}
        title={confirmSuspendMember?.status === 'Suspended' ? `Reactivate ${confirmSuspendMember?.name}?` : `Suspend ${confirmSuspendMember?.name}?`}
        description={
          confirmSuspendMember?.status === 'Suspended'
            ? `Restore permissions and access for ${confirmSuspendMember?.name}?`
            : `Suspend access for ${confirmSuspendMember?.name}?`
        }
        confirmText={confirmSuspendMember?.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
        confirmVariant={confirmSuspendMember?.status === 'Suspended' ? 'primary' : 'warning'}
        icon={confirmSuspendMember?.status === 'Suspended' ? 'play_circle' : 'pause_circle'}
        onConfirm={() => {
          handleToggleSuspendMember(confirmSuspendMember.id);
          setConfirmSuspendMember(null);
        }}
        onClose={() => setConfirmSuspendMember(null)}
      />

      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleCreateInvite}
      />

      {roleEditingMember && (
        <ManageMemberRoleModal
          isOpen={Boolean(roleEditingMember)}
          member={roleEditingMember}
          teamId={teamId}
          onClose={() => setRoleEditingMember(null)}
          onSaveRole={handleSaveMemberRole}
        />
      )}
    </div>
  );
}
