import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useWorkspace } from '@/context/useWorkspace';
import { useToast } from '@/lib/useToast';

export function useTeamMembers(teamId) {
  const { can, roles: workspaceRoles } = useWorkspace();
  const isTeamAdmin = can('team.admin') || can('role.assign');
  const canInvite = can('membership.create') || isTeamAdmin;
  const canManageRoles = can('role.assign') || isTeamAdmin;
  const canManageMembers = can('membership.remove') || can('membership.update') || isTeamAdmin;

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
            permissions: m.permissions || [],
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

  const handleOpenMember = useCallback((member) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleToggleSuspendMember = useCallback(async (memberId) => {
    const target = members.find((m) => m.id === memberId || m.membershipId === memberId);
    if (!target || !teamId) return;

    const isSuspended =
      target.status === 'Suspended' ||
      target.status === 'SUSPENDED' ||
      target.status?.toLowerCase() === 'suspended';
    const action = isSuspended ? 'reactivate' : 'suspend';
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
      fetchMembersAndInvitations();
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update member status.', 'error');
    }
  }, [members, teamId, selectedMember, showToast, fetchMembersAndInvitations]);

  const handleConfirmRemoveMember = useCallback(async (memberId) => {
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
  }, [members, teamId, showToast]);

  const handleSaveMemberRole = useCallback((updatedMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    if (selectedMember?.id === updatedMember.id) {
      setSelectedMember(updatedMember);
    }
    setRoleEditingMember(null);
    showToast(`Role updated for ${updatedMember.name}.`);
    fetchMembersAndInvitations();
  }, [selectedMember, showToast, fetchMembersAndInvitations]);

  const handleConfirmRevokeInvite = useCallback(async (inviteId) => {
    if (!teamId) return;
    try {
      await api.delete(`/api/teams/${teamId}/invitations/${inviteId}`);
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== inviteId));
      setConfirmRevokeInvite(null);
      showToast('Invitation successfully revoked.');
      fetchMembersAndInvitations();
    } catch (err) {
      console.error('Failed to revoke invitation:', err);
      showToast(err.response?.data?.error?.message || 'Failed to revoke invitation.', 'error');
    }
  }, [teamId, showToast, fetchMembersAndInvitations]);

  const handleCreateInvite = useCallback(async ({ email, role }) => {
    if (!teamId) return;
    try {
      let rolesList = workspaceRoles || [];
      if (rolesList.length === 0) {
        const rolesRes = await api.get('/api/roles', { params: { teamId } });
        rolesList = rolesRes.data?.data || [];
      }
      const matchedRole = rolesList.find(
        (r) => r.name?.toLowerCase() === (role || 'developer').toLowerCase()
      );
      const roleIds = matchedRole ? [matchedRole._id] : [];

      await api.post(`/api/teams/${teamId}/invitations`, {
        email: email.trim().toLowerCase(),
        roleIds,
      });

      setIsInviteModalOpen(false);
      setActiveMainTab('invitations');
      showToast(`Invitation dispatched to ${email}.`);
      fetchMembersAndInvitations();
    } catch (err) {
      console.error('Failed to send invitation:', err);
      showToast(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to send invitation.',
        'error'
      );
    }
  }, [teamId, workspaceRoles, showToast, fetchMembersAndInvitations]);

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

  return {
    members,
    pendingInvitations,
    filteredMembers,
    filteredInvitations,
    loading,
    activeMainTab,
    setActiveMainTab,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    selectedMember,
    setSelectedMember,
    isDrawerOpen,
    handleOpenMember,
    handleCloseDrawer,
    isInviteModalOpen,
    setIsInviteModalOpen,
    confirmRevokeInvite,
    setConfirmRevokeInvite,
    confirmRemovalMember,
    setConfirmRemovalMember,
    confirmSuspendMember,
    setConfirmSuspendMember,
    roleEditingMember,
    setRoleEditingMember,
    toast,
    canInvite,
    canManageRoles,
    canManageMembers,
    handleToggleSuspendMember,
    handleConfirmRemoveMember,
    handleSaveMemberRole,
    handleConfirmRevokeInvite,
    handleCreateInvite,
    refresh: fetchMembersAndInvitations,
  };
}
