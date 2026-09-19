import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  STATUS_LABELS,
  getNextWorkspace,
  getRoleOptions,
  getWorkspaceOptions,
  normalizeUserWorkspaces,
} from './manageUserModel';

function getStatusConfirm({ newStatus, accountStatus, user, setAccountStatus, setConfirmModal }) {
  if (newStatus === 'suspended') {
    return {
      title: 'Suspend User Account?',
      message: `Are you sure you want to suspend ${user.name}? This will immediately block their login and freeze their access across all workspaces.`,
      icon: 'pause_circle',
      confirmButtonText: 'Yes, Suspend Account',
      confirmButtonClass: 'bg-error text-on-error hover:opacity-90',
      onConfirm: () => {
        setAccountStatus('suspended');
        setConfirmModal(null);
      },
    };
  }

  if (newStatus === 'disabled') {
    return {
      title: 'Deactivate / Disable User Account?',
      message: `Are you sure you want to disable ${user.name}? This will permanently revoke platform access while keeping historical records intact.`,
      icon: 'block',
      confirmButtonText: 'Yes, Disable Account',
      confirmButtonClass: 'bg-error text-on-error hover:opacity-90',
      onConfirm: () => {
        setAccountStatus('disabled');
        setConfirmModal(null);
      },
    };
  }

  if (accountStatus === 'suspended' || accountStatus === 'disabled') {
    return {
      title: 'Reactivate User Account?',
      message: `Are you sure you want to reactivate ${user.name}? They will be able to log in and access their assigned workspaces again.`,
      icon: 'check_circle',
      confirmButtonText: 'Yes, Reactivate',
      confirmButtonClass: 'bg-success-text text-on-primary hover:opacity-90',
      onConfirm: () => {
        setAccountStatus(newStatus);
        setConfirmModal(null);
      },
    };
  }

  return null;
}

export function useManageUserForm({ isOpen, onClose, onSaveUser, user }) {
  const [accountStatus, setAccountStatus] = useState(() => user?.statusType || user?.status?.toLowerCase() || 'active');
  const [workspaces, setWorkspaces] = useState(() => normalizeUserWorkspaces(user));
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => Boolean(user?.isSuperAdmin));
  const [mustChangePassword, setMustChangePassword] = useState(() => Boolean(user?.mustChangePassword));
  const [sessionsTerminated, setSessionsTerminated] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [teams, setTeams] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (!isOpen || !user) return;

    setAccountStatus(user?.statusType || user?.status?.toLowerCase() || 'active');
    setWorkspaces(normalizeUserWorkspaces(user));
    setIsSuperAdmin(Boolean(user?.isSuperAdmin));
    setMustChangePassword(Boolean(user?.mustChangePassword));
    setSessionsTerminated(false);
    setConfirmModal(null);

    Promise.allSettled([
      api.get('/api/teams?status=all'),
      api.get('/api/roles?status=all'),
    ]).then(([teamsRes, rolesRes]) => {
      if (teamsRes.status === 'fulfilled') {
        const list = teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || [];
        if (Array.isArray(list) && list.length > 0) setTeams(list);
      }
      if (rolesRes.status === 'fulfilled') {
        const roleList = rolesRes.value.data?.data?.roles || rolesRes.value.data?.data || [];
        if (Array.isArray(roleList) && roleList.length > 0) setRoles(roleList);
      }
    });
  }, [isOpen, user]);

  const workspaceOptions = getWorkspaceOptions(teams);
  const availableRoleNames = getRoleOptions(roles);

  const handleToggleTeamAdmin = (index, isTeamAdmin) => {
    setWorkspaces((prev) => prev.map((item, i) => (i === index ? { ...item, isTeamAdmin } : item)));
  };

  const handleWorkspaceChange = (index, name) => {
    setWorkspaces((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  const handleAddWorkspace = () => {
    const nextWorkspace = getNextWorkspace({ workspaces, workspaceOptions });
    setWorkspaces((prev) => [
      ...prev,
      {
        name: nextWorkspace,
        role: availableRoleNames[0] || 'Developer',
        isTeamAdmin: false,
      },
    ]);
  };

  const handleStatusChangeRequest = (newStatus) => {
    if (newStatus === accountStatus) return;
    const confirm = getStatusConfirm({ newStatus, accountStatus, user, setAccountStatus, setConfirmModal });
    if (confirm) setConfirmModal(confirm);
    else setAccountStatus(newStatus);
  };

  const handleRemoveWorkspaceRequest = (index) => {
    const targetWorkspace = workspaces[index];
    const workspaceName = targetWorkspace ? targetWorkspace.name : 'this workspace';
    setConfirmModal({
      title: 'Remove Workspace Access?',
      message: `Are you sure you want to remove ${user.name}'s access to "${workspaceName}"? They will lose their role permissions for this team.`,
      icon: 'delete',
      confirmButtonText: 'Yes, Remove Access',
      confirmButtonClass: 'bg-error text-on-error hover:opacity-90',
      onConfirm: () => {
        setWorkspaces((prev) => prev.filter((_, i) => i !== index));
        setConfirmModal(null);
      },
    });
  };

  const handleRoleChange = (index, role) => {
    setWorkspaces((prev) => prev.map((workspace, i) => (i === index ? { ...workspace, role } : workspace)));
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      status: STATUS_LABELS[accountStatus] || 'Active',
      statusType: accountStatus,
      workspaces: workspaces.map((workspace) => ({
        name: workspace.name,
        role: workspace.role,
        isTeamAdmin: Boolean(workspace.isTeamAdmin),
        isHigh: Boolean(workspace.isTeamAdmin),
      })),
      isTeamAdmin: workspaces.some((workspace) => workspace.isTeamAdmin),
      isSuperAdmin,
      mustChangePassword,
      lastLogoutAt: sessionsTerminated ? new Date().toISOString() : user.lastLogoutAt,
    };

    onSaveUser?.(updatedUser);
    onClose();
  };

  return {
    accountStatus,
    availableRoleNames,
    confirmModal,
    isSuperAdmin,
    mustChangePassword,
    sessionsTerminated,
    workspaceOptions,
    workspaces,
    handleAddWorkspace,
    handleRemoveWorkspaceRequest,
    handleRoleChange,
    handleSave,
    handleStatusChangeRequest,
    handleToggleTeamAdmin,
    handleWorkspaceChange,
    setConfirmModal,
    setIsSuperAdmin,
    setMustChangePassword,
    setSessionsTerminated,
  };
}
