import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/context/useApp';
import api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/lib/useToast';

const PAGE_SIZE = 12;

function normalizeMember(member) {
  const user = member.user || member.userId || {};
  const name = user.name || member.name || 'Member';
  const roleName = member.roles?.[0]?.name || member.role?.name || member.role || 'Member';

  return {
    id: member._id || member.id,
    membershipId: member._id || member.id,
    userId: user._id || user.id || member.userId,
    name,
    email: user.email || member.email || '',
    role: roleName,
    teamRole: roleName,
    permissions: member.permissions || [],
    department: member.department || 'Engineering',
    status: member.status === 'ACTIVE' ? 'Active' : member.status === 'SUSPENDED' ? 'Suspended' : member.status || 'Active',
    joinedDate: member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active',
    ...member,
  };
}

function normalizeInvitation(invitation) {
  return {
    id: invitation._id || invitation.id,
    email: invitation.email,
    name: invitation.email.split('@')[0],
    role: invitation.roleIds?.[0]?.name || 'Invited Member',
    department: 'Engineering',
    invitedBy: invitation.invitedBy?.name || 'Admin',
    sentDate: invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : 'Recent',
    expiresDate: invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : '1 hour',
    status: invitation.status === 'PENDING' ? 'Pending Acceptance' : invitation.status,
  };
}

export function useTeamMembersDirectory({ currentUser, workspace }) {
  const queryClient = useQueryClient();
  const { activeWorkspace, hasPermission: hasPermissionContext } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isTeamAdmin = Boolean(currentUser?.isTeamAdmin);
  const [toast, showToast] = useToast();

  const hasPermission = useCallback(
    (permission) => {
      if (isTeamAdmin || currentUser?.isSuperAdmin) return true;
      if (typeof currentUser?.hasPermission === 'function') return currentUser.hasPermission(permission);
      if (typeof hasPermissionContext === 'function') return hasPermissionContext(permission);
      return (currentUser?.permissions || []).includes(permission);
    },
    [currentUser, hasPermissionContext, isTeamAdmin]
  );

  const permissions = {
    canAssignRole: isTeamAdmin || hasPermission('role.assign'),
    canInvite: isTeamAdmin || hasPermission('invitation.create') || hasPermission('membership.create'),
    canManageMembership: isTeamAdmin || hasPermission('membership.update'),
    canRemoveMember: isTeamAdmin || hasPermission('membership.remove'),
    canRevokeInvite: isTeamAdmin || hasPermission('invitation.revoke'),
  };

  const [activeTab, setActiveTab] = useState('members');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [confirmRevokeInvite, setConfirmRevokeInvite] = useState(null);
  const [confirmRemovalMember, setConfirmRemovalMember] = useState(null);
  const [confirmSuspendMember, setConfirmSuspendMember] = useState(null);
  const [roleEditingMember, setRoleEditingMember] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: membersData = { members: [], total: 0, totalPages: 1 },
    isLoading: isMembersLoading,
  } = useQuery({
    queryKey: queryKeys.team.members(teamId, { page: currentPage, limit: PAGE_SIZE, q: debouncedSearch, status: statusFilter }),
    queryFn: async () => {
      if (!teamId) return { members: [], total: 0, totalPages: 1 };
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(PAGE_SIZE));
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter.toUpperCase());

      const res = await api.get(`/api/teams/${teamId}/members?${params.toString()}`);
      const raw = res.data?.data?.members || res.data?.data || [];
      const pagination = res.data?.pagination || {};
      const total = pagination.total ?? raw.length ?? 0;
      const totalPages = Math.max(1, pagination.totalPages || Math.ceil((pagination.total || raw.length || 0) / PAGE_SIZE) || 1);
      return { members: raw.map(normalizeMember), total, totalPages };
    },
    enabled: Boolean(teamId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });

  const {
    data: pendingInvitations = [],
  } = useQuery({
    queryKey: queryKeys.team.invitations(teamId),
    queryFn: async () => {
      if (!teamId) return [];
      const res = await api.get(`/api/teams/${teamId}/invitations`);
      const raw = res.data?.data?.invitations || res.data?.data || [];
      return raw.map(normalizeInvitation);
    },
    enabled: Boolean(teamId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });

  const members = membersData.members;
  const totalMembers = membersData.total;
  const totalPages = membersData.totalPages;

  const invalidateTeamData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['team', teamId, 'members'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.team.memberList(teamId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.team.invitations(teamId) });
  }, [queryClient, teamId]);

  const handleToggleSuspendMember = async (memberId) => {
    const target = members.find((member) => member.id === memberId || member.membershipId === memberId);
    if (!target || !teamId) return;

    const isSuspended = target.status === 'Suspended' || target.status === 'SUSPENDED';
    const action = isSuspended ? 'reactivate' : 'suspend';
    try {
      await api.patch(`/api/teams/${teamId}/members/${target.membershipId || target.id}/${action}`);
      const newStatus = action === 'reactivate' ? 'Active' : 'Suspended';
      if (selectedMember?.id === memberId) setSelectedMember((prev) => ({ ...prev, status: newStatus }));
      showToast(`Member status updated to ${newStatus}.`);
      invalidateTeamData();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update member status.', 'error');
    }
  };

  const handleConfirmRemoveMember = async (memberId) => {
    const target = members.find((member) => member.id === memberId || member.membershipId === memberId);
    if (!target || !teamId) return;
    try {
      await api.delete(`/api/teams/${teamId}/members/${target.membershipId || target.id}`);
      setConfirmRemovalMember(null);
      setIsDrawerOpen(false);
      setSelectedMember(null);
      showToast('Member removed from the workspace.');
      invalidateTeamData();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to remove member.', 'error');
    }
  };

  const handleSaveMemberRole = (updatedMember) => {
    if (selectedMember?.id === updatedMember.id) setSelectedMember(updatedMember);
    setRoleEditingMember(null);
    showToast(`Role updated for ${updatedMember.name}.`);
    invalidateTeamData();
  };

  const handleConfirmRevokeInvite = async (inviteId) => {
    if (!teamId) return;
    try {
      await api.delete(`/api/teams/${teamId}/invitations/${inviteId}`);
      setConfirmRevokeInvite(null);
      showToast('Invitation revoked.');
      invalidateTeamData();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to revoke invitation.', 'error');
    }
  };

  const handleCreateInvite = async ({ email, role }) => {
    if (!teamId) return;
    try {
      const rolesRes = await api.get('/api/roles', { params: { teamId } });
      const rolesList = rolesRes.data?.data || [];
      const matched = rolesList.find((teamRole) => teamRole.name.toLowerCase() === (role || 'developer').toLowerCase());
      await api.post(`/api/teams/${teamId}/invitations`, {
        email: email.trim().toLowerCase(),
        roleIds: matched ? [matched._id] : [],
      });
      setIsInviteModalOpen(false);
      setActiveTab('invitations');
      showToast(`Invitation sent to ${email}.`);
      invalidateTeamData();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to send invitation.', 'error');
    }
  };

  const filteredMembers = members.filter((member) => (
    selectedRole === 'All Roles' || member.role?.toLowerCase() === selectedRole.toLowerCase()
  ));

  const filteredInvitations = pendingInvitations.filter((invitation) => (
    !searchQuery ||
    [invitation.email, invitation.name, invitation.role, invitation.department]
      .some((field) => field?.toLowerCase().includes(searchQuery.toLowerCase()))
  ));

  const openMemberDrawer = (member) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  return {
    activeTab,
    confirmRemovalMember,
    confirmRevokeInvite,
    confirmSuspendMember,
    currentPage,
    currentUserId,
    filteredInvitations,
    filteredMembers,
    isDrawerOpen,
    isInviteModalOpen,
    isMembersLoading,
    isTeamAdmin,
    pageSize: PAGE_SIZE,
    pendingInvitations,
    permissions,
    roleEditingMember,
    searchQuery,
    selectedMember,
    selectedRole,
    statusFilter,
    teamId,
    toast,
    totalMembers,
    totalPages,
    viewMode,
    handleConfirmRemoveMember,
    handleConfirmRevokeInvite,
    handleCreateInvite,
    handleSaveMemberRole,
    handleToggleSuspendMember,
    openMemberDrawer,
    setActiveTab,
    setConfirmRemovalMember,
    setConfirmRevokeInvite,
    setConfirmSuspendMember,
    setCurrentPage,
    setIsDrawerOpen,
    setIsInviteModalOpen,
    setRoleEditingMember,
    setSearchQuery,
    setSelectedRole,
    setStatusFilter,
    setViewMode,
  };
}
