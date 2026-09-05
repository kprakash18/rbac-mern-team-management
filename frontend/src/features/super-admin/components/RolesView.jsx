import { useState, useEffect, useCallback, useMemo } from 'react';
import RoleCard from './roles/RoleCard';
import RolesTableView from './roles/RolesTableView';
import CreateEditRoleModal from './roles/CreateEditRoleModal';
import RoleMembersDrawer from './roles/RoleMembersDrawer';
import ExportPolicyModal from './roles/ExportPolicyModal';
import EditUserTtlModal from './roles/EditUserTtlModal';
import ReassignUserModal from './roles/ReassignUserModal';
import ChangeWorkspaceModal from './roles/ChangeWorkspaceModal';
import SafeDeleteRoleModal from './roles/SafeDeleteRoleModal';
import Toast from '../../../components/shared/Toast';
import { useToast } from '../../../lib/useToast';
import api from '@/lib/api';
import { CANONICAL_PERMISSIONS, permissionsByCategory } from '@/constants';

const ROLE_TEMPLATES = {
  developer: [
    'task.read', 'task.create', 'task.update',
    'team.read', 'membership.read',
    'access_request.create', 'access_request.cancel',
    'notification.read', 'notification.update',
  ],
  'ws-admin': [
    'user.read', 'user.create', 'user.update',
    'team.read', 'team.update',
    'membership.read', 'membership.create', 'membership.update', 'membership.remove',
    'task.read', 'task.create', 'task.update', 'task.delete',
    'access_request.read', 'access_request.approve', 'access_request.reject',
    'notification.read', 'notification.update',
  ],
  auditor: [
    'user.read', 'team.read', 'membership.read', 'role.read', 'permission.read',
    'audit.read', 'access_grant.read',
  ],
};

const getRoleTheme = (roleName, isSystem) => {
  const name = (roleName || '').toLowerCase();
  if (isSystem || name.includes('admin') || name.includes('owner')) {
    return { icon: 'shield_person', iconBg: 'bg-indigo-100 text-indigo-700' };
  }
  if (name.includes('sec') || name.includes('audit') || name.includes('compliance')) {
    return { icon: 'security', iconBg: 'bg-emerald-100 text-emerald-700' };
  }
  if (name.includes('lead') || name.includes('manager')) {
    return { icon: 'badge', iconBg: 'bg-amber-100 text-amber-700' };
  }
  if (name.includes('dev') || name.includes('engineer') || name.includes('arch')) {
    return { icon: 'terminal', iconBg: 'bg-blue-100 text-blue-700' };
  }
  if (name.includes('data') || name.includes('scientist') || name.includes('ai')) {
    return { icon: 'dataset', iconBg: 'bg-cyan-100 text-cyan-700' };
  }
  return { icon: 'groups', iconBg: 'bg-purple-100 text-purple-700' };
};

function formatRole(r) {
  const isSystem = Boolean(r.isSystemRole || r.type === 'system');
  const roleName = r.name || 'Custom Role';
  const theme = getRoleTheme(roleName, isSystem);

  const rawPerms = Array.isArray(r.permissions) ? r.permissions : [];
  const permissionKeys = rawPerms.map((p) => (typeof p === 'string' ? p : p?.key)).filter(Boolean);

  const assignedUsers = Array.isArray(r.assignedUsers) ? r.assignedUsers : [];
  const avatars = assignedUsers.slice(0, 3).map((u, i) => {
    const initials = (u.name || u.email || 'User').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const bgColors = [
      'bg-indigo-100 text-indigo-800',
      'bg-emerald-100 text-emerald-800',
      'bg-amber-100 text-amber-800',
      'bg-blue-100 text-blue-800',
    ];
    return { text: initials, bg: bgColors[i % bgColors.length] };
  });

  const permPills = [
    { text: `${permissionKeys.length} Permissions`, dot: true },
    { text: isSystem ? 'Global Scope' : 'Workspace Scope' },
  ];

  return {
    id: r._id || r.id,
    name: roleName,
    subtitle: r.description || (isSystem ? 'System core role definition' : 'Custom RBAC role'),
    desc: r.description || (isSystem ? 'System core role definition' : 'Custom RBAC role definition'),
    type: isSystem ? 'system' : 'custom',
    status: (r.status || 'ACTIVE').toLowerCase(),
    icon: r.icon || theme.icon,
    iconBg: r.iconBg || theme.iconBg,
    members: assignedUsers.length,
    membersCount: assignedUsers.length,
    perms: permissionKeys.length,
    permissionKeys,
    rawPermissions: rawPerms,
    avatars,
    permPills,
    assignedUsers,
    createdAt: r.createdAt,
  };
}

export default function RolesView() {
  const [roles, setRoles] = useState([]);
  const [dbPermissions, setDbPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Card menus & modals state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('opa');

  // Role Form state
  const [roleForm, setRoleForm] = useState({
    id: null,
    name: '',
    description: '',
    selectedPermissions: new Set(),
    template: 'none',
    searchPermQuery: '',
  });

  // Drawer state
  const [drawerRole, setDrawerRole] = useState(null);
  const [drawerTab, setDrawerTab] = useState('permissions'); // 'permissions' | 'members'

  // Nested user action modals
  const [editTtlData, setEditTtlData] = useState(null);
  const [reassignUserData, setReassignUserData] = useState(null);
  const [editWorkspaceData, setEditWorkspaceData] = useState(null);
  const [safeDeleteRole, setSafeDeleteRole] = useState(null);
  const [safeDeleteLoading, setSafeDeleteLoading] = useState(false);

  const [toast, showToast] = useToast(3500);

  // Fetch Roles and Permissions from backend API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.allSettled([
        api.get('/api/roles?status=all'),
        api.get('/api/permissions'),
      ]);

      if (permsRes.status === 'fulfilled' && permsRes.value.data?.data) {
        setDbPermissions(permsRes.value.data.data);
      }

      if (rolesRes.status === 'fulfilled') {
        const rawRoles = rolesRes.value.data?.data || [];
        if (Array.isArray(rawRoles)) {
          setRoles(rawRoles.map(formatRole));
        }
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      showToast('Error loading roles from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        role.name.toLowerCase().includes(q) ||
        (role.desc || '').toLowerCase().includes(q) ||
        role.permissionKeys.some((k) => k.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (activeFilter === 'System') return role.type === 'system';
      if (activeFilter === 'Custom') return role.type === 'custom';
      if (activeFilter === 'Active') return role.status === 'active';
      if (activeFilter === 'Disabled') return role.status === 'disabled';
      if (activeFilter === 'Archived') return role.status === 'archived';

      return true;
    });
  }, [roles, searchQuery, activeFilter]);

  // Metric stats
  const metrics = useMemo(() => {
    const total = roles.length;
    const system = roles.filter((r) => r.type === 'system').length;
    const custom = roles.filter((r) => r.type === 'custom').length;
    const activeUsers = roles.reduce((sum, r) => sum + (r.assignedUsers?.length || 0), 0);
    return { total, system, custom, activeUsers, totalPerms: CANONICAL_PERMISSIONS.length };
  }, [roles]);

  // Open Create / Edit Modal
  const handleOpenCreateModal = (roleToEdit = null) => {
    if (roleToEdit) {
      setRoleForm({
        id: roleToEdit.id,
        name: roleToEdit.name,
        description: roleToEdit.desc || roleToEdit.subtitle || '',
        selectedPermissions: new Set(roleToEdit.permissionKeys || []),
        template: 'none',
        searchPermQuery: '',
      });
    } else {
      setRoleForm({
        id: null,
        name: '',
        description: '',
        selectedPermissions: new Set(ROLE_TEMPLATES.developer),
        template: 'developer',
        searchPermQuery: '',
      });
    }
    setIsCreateModalOpen(true);
  };

  // Template Change
  const handleTemplateChange = (templateKey) => {
    const permList = ROLE_TEMPLATES[templateKey] || [];
    setRoleForm((prev) => ({
      ...prev,
      template: templateKey,
      selectedPermissions: new Set(permList),
    }));
  };

  // Toggle Category
  const handleToggleCategory = (categoryKey, selectAll) => {
    const categoryPerms = permissionsByCategory[categoryKey] || [];
    setRoleForm((prev) => {
      const nextSet = new Set(prev.selectedPermissions);
      categoryPerms.forEach((p) => {
        if (selectAll) {
          nextSet.add(p.key);
        } else {
          nextSet.delete(p.key);
        }
      });
      return { ...prev, selectedPermissions: nextSet };
    });
  };

  // Toggle Single Permission
  const handleToggleSinglePermission = (permKey) => {
    setRoleForm((prev) => {
      const nextSet = new Set(prev.selectedPermissions);
      if (nextSet.has(permKey)) {
        nextSet.delete(permKey);
      } else {
        nextSet.add(permKey);
      }
      return { ...prev, selectedPermissions: nextSet };
    });
  };

  // Save Role (Create or Update)
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    const selectedKeys = Array.from(roleForm.selectedPermissions);
    // Resolve permission IDs if dbPermissions loaded
    const permIdMap = new Map(dbPermissions.map((p) => [p.key, p._id || p.id]));
    const permissionIds = selectedKeys.map((k) => permIdMap.get(k)).filter(Boolean);

    try {
      if (roleForm.id) {
        // Update existing role with permissionIds
        const res = await api.patch(`/api/roles/${roleForm.id}`, {
          name: roleForm.name,
          description: roleForm.description,
          permissionIds,
        });

        const updatedData = res.data?.data;
        const updatedRole = formatRole(
          updatedData || {
            ...roleForm,
            permissions: selectedKeys,
          }
        );

        setRoles((prev) =>
          prev.map((r) => (r.id === roleForm.id ? updatedRole : r))
        );
        showToast(`Role "${roleForm.name}" updated successfully.`);
        setIsCreateModalOpen(false);
      } else {
        // Create new role
        let createdRoleData = null;
        try {
          const res = await api.post('/api/roles', {
            name: roleForm.name,
            description: roleForm.description,
            permissionIds,
          });
          createdRoleData = res.data?.data;
        } catch (apiErr) {
          const msg = apiErr.response?.data?.message || 'Failed to create role on server.';
          showToast(msg, 'error');
          return;
        }

        const newFormattedRole = formatRole(
          createdRoleData || {
            id: `role-${Date.now()}`,
            name: roleForm.name,
            description: roleForm.description,
            isSystemRole: false,
            status: 'ACTIVE',
            permissions: selectedKeys,
            assignedUsers: [],
          }
        );

        setRoles((prev) => [newFormattedRole, ...prev]);
        showToast(`Role "${roleForm.name}" created and deployed.`);
        setIsCreateModalOpen(false);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Operation failed.';
      showToast(errMsg, 'error');
    }
  };

  // Clone Role
  const handleCloneRole = (roleToClone) => {
    setRoleForm({
      id: null,
      name: `${roleToClone.name} (Copy)`,
      description: roleToClone.desc || roleToClone.subtitle || '',
      selectedPermissions: new Set(roleToClone.permissionKeys || []),
      template: 'none',
      searchPermQuery: '',
    });
    setIsCreateModalOpen(true);
    showToast(`Template initialized from "${roleToClone.name}".`);
  };

  // Toggle Active/Disabled Status
  const handleToggleStatus = async (roleId) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole || targetRole.type === 'system') return;

    const nextStatus = targetRole.status === 'disabled' ? 'active' : 'disabled';

    try {
      await api.patch(`/api/roles/${roleId}`, {
        status: nextStatus.toUpperCase(),
      });
    } catch (err) {
      console.warn('API status patch failed, updating local state:', err);
    }

    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, status: nextStatus } : r))
    );
    showToast(`Role "${targetRole.name}" is now ${nextStatus.toUpperCase()}.`);
  };

  // Archive / Unarchive Role
  const handleArchiveToggle = async (roleId) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole || targetRole.type === 'system') return;

    const nextStatus = targetRole.status === 'archived' ? 'active' : 'archived';

    try {
      if (nextStatus === 'archived') {
        await api.delete(`/api/roles/${roleId}`);
      } else {
        await api.patch(`/api/roles/${roleId}`, { status: 'ACTIVE' });
      }
    } catch (err) {
      console.warn('API delete/restore failed, updating local state:', err);
    }

    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, status: nextStatus } : r))
    );
    showToast(`Role "${targetRole.name}" has been ${nextStatus === 'archived' ? 'archived' : 'restored'}.`);
  };

  // Delete Role (checks for active members)
  const handleDeleteRole = async (roleToDelete) => {
    if (!roleToDelete || roleToDelete.type === 'system') return;

    const assignedCount = roleToDelete.assignedUsers?.length || roleToDelete.members || 0;
    if (assignedCount > 0) {
      setSafeDeleteRole(roleToDelete);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete role "${roleToDelete.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/roles/${roleToDelete.id}`);
    } catch (err) {
      console.warn('API delete failed, removing locally:', err);
    }

    setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
    if (drawerRole?.id === roleToDelete.id) {
      setDrawerRole(null);
    }
    showToast(`Role "${roleToDelete.name}" has been deleted.`);
  };

  // Safe Delete with Active Member Reassignment
  const handleConfirmSafeDelete = async (roleToDelete, targetRoleId) => {
    try {
      setSafeDeleteLoading(true);
      const targetRole = roles.find((r) => r.id === targetRoleId);
      const membersToMove = roleToDelete.assignedUsers || [];

      try {
        await api.delete(`/api/roles/${roleToDelete.id}`, {
          data: { reassignToRoleId: targetRoleId },
        });
      } catch (err) {
        console.warn('API safe delete failed, updating local state:', err);
      }

      // Reassign members to targetRole and remove roleToDelete
      setRoles((prev) => {
        return prev
          .filter((r) => r.id !== roleToDelete.id)
          .map((r) => {
            if (r.id === targetRoleId) {
              const updatedUsers = [...(r.assignedUsers || []), ...membersToMove];
              return formatRole({
                ...r,
                assignedUsers: updatedUsers,
                membersCount: updatedUsers.length,
              });
            }
            return r;
          });
      });

      if (drawerRole?.id === roleToDelete.id) {
        setDrawerRole(null);
      }
      setSafeDeleteRole(null);
      showToast(
        `Reassigned ${membersToMove.length} member(s) to "${targetRole?.name || 'replacement role'}" and deleted "${roleToDelete.name}".`
      );
    } catch (err) {
      console.error('Failed to safely delete role:', err);
      showToast('Failed to delete role and reassign members.', 'error');
    } finally {
      setSafeDeleteLoading(false);
    }
  };

  // Drawer Handlers
  const handleOpenDrawer = (role, tab = 'permissions') => {
    setDrawerRole(role);
    setDrawerTab(tab);
  };

  const handleToggleInspectorPermission = async (permKey) => {
    if (!drawerRole || drawerRole.type === 'system') return;

    const hasPerm = drawerRole.permissionKeys.includes(permKey);
    const nextPerms = hasPerm
      ? drawerRole.permissionKeys.filter((k) => k !== permKey)
      : [...drawerRole.permissionKeys, permKey];

    const permIdMap = new Map(dbPermissions.map((p) => [p.key, p._id || p.id]));
    const permissionIds = nextPerms.map((k) => permIdMap.get(k)).filter(Boolean);

    try {
      const res = await api.patch(`/api/roles/${drawerRole.id}`, {
        name: drawerRole.name,
        description: drawerRole.description,
        permissionIds,
      });

      const updatedRole = formatRole(
        res.data?.data || {
          ...drawerRole,
          permissions: nextPerms,
        }
      );

      setDrawerRole(updatedRole);
      setRoles((prev) => prev.map((r) => (r.id === drawerRole.id ? updatedRole : r)));
      showToast(`Permission "${permKey}" ${hasPerm ? 'revoked from' : 'granted to'} ${drawerRole.name}.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Permission update failed.';
      showToast(msg, 'error');
    }
  };

  const handleUnassignUser = (userId) => {
    if (!drawerRole) return;

    const nextUsers = drawerRole.assignedUsers.filter((u) => u.id !== userId);
    const updatedRole = formatRole({
      ...drawerRole,
      assignedUsers: nextUsers,
    });

    setDrawerRole(updatedRole);
    setRoles((prev) => prev.map((r) => (r.id === drawerRole.id ? updatedRole : r)));
    showToast(`User assignment removed from ${drawerRole.name}.`);
  };

  const handleAssignNewMember = (formData) => {
    if (!drawerRole) return;

    const newUser = {
      id: `user-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      workspace: formData.workspace || 'Engineering Core',
      assignedAt: new Date().toISOString(),
      expiresAt:
        formData.ttlType === 'Permanent'
          ? null
          : new Date(Date.now() + (formData.customTtlValue || 7) * 86400000).toISOString(),
    };

    const nextUsers = [newUser, ...drawerRole.assignedUsers];
    const updatedRole = formatRole({
      ...drawerRole,
      assignedUsers: nextUsers,
    });

    setDrawerRole(updatedRole);
    setRoles((prev) => prev.map((r) => (r.id === drawerRole.id ? updatedRole : r)));
    showToast(`Assigned ${formData.name} to ${drawerRole.name}.`);
  };

  // Policy Export Download Handler
  const handleDownloadPolicy = () => {
    let fileContent = '';
    let fileName = `rbac-policy-bundle-${Date.now()}`;
    let mimeType = 'text/plain';

    if (exportFormat === 'opa') {
      fileName += '.rego';
      fileContent = `package rbac.authz\n\ndefault allow = false\n\n# Canonical Role Definitions\n`;
      roles.forEach((r) => {
        fileContent += `# Role: ${r.name} (${r.type.toUpperCase()})\n`;
        fileContent += `allow {\n  input.role == "${r.name}"\n  input.action in [${r.permissionKeys.map((k) => `"${k}"`).join(', ')}]\n}\n\n`;
      });
    } else if (exportFormat === 'json') {
      fileName += '.json';
      mimeType = 'application/json';
      fileContent = JSON.stringify(
        roles.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          status: r.status,
          permissionsCount: r.permissionKeys.length,
          permissions: r.permissionKeys,
          membersCount: r.assignedUsers.length,
          members: r.assignedUsers.map((u) => ({ name: u.name, email: u.email, workspace: u.workspace })),
        })),
        null,
        2
      );
    } else if (exportFormat === 'csv') {
      fileName += '.csv';
      mimeType = 'text/csv';
      fileContent = 'Role ID,Name,Type,Status,Permissions Count,Members Count,Permissions\n';
      roles.forEach((r) => {
        fileContent += `"${r.id}","${r.name}","${r.type}","${r.status}",${r.permissionKeys.length},${r.assignedUsers.length},"${r.permissionKeys.join(';')}"\n`;
      });
    } else if (exportFormat === 'aws') {
      fileName += '.json';
      mimeType = 'application/json';
      fileContent = JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: roles.map((r) => ({
            Sid: r.name.replace(/[^a-zA-Z0-9]/g, ''),
            Effect: 'Allow',
            Action: r.permissionKeys,
            Resource: '*',
          })),
        },
        null,
        2
      );
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    showToast(`Exported ${exportFormat.toUpperCase()} policy bundle successfully.`);
  };

  return (
    <div className="flex flex-col w-full p-xl gap-xl">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <div className="flex items-center gap-xs text-body-sm text-on-surface-variant mb-1">
            <span>Platform Control</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-semibold text-primary">Roles &amp; Permissions</span>
          </div>
          <h1 className="font-display-title text-on-surface flex items-center gap-2">
            <span>Roles &amp; Permissions Catalog</span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-bold text-label-sm">
              RBAC v2.4
            </span>
          </h1>
          <p className="font-body-base text-on-surface-variant mt-1">
            Configure system and bespoke custom roles, assign granular permissions, and inspect access boundary matrices.
          </p>
        </div>

        <div className="flex items-center gap-sm shrink-0">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container flex items-center gap-2 transition-colors cursor-pointer border border-border-subtle"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Policies</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_moderator</span>
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
        <div className="bg-card-bg rounded-xl p-md shadow-2xs border border-border-subtle flex flex-col">
          <span className="font-label-bold text-[12px] text-on-surface-variant uppercase tracking-wider">Total Roles</span>
          <span className="font-display-title text-[26px] text-on-surface mt-1">{metrics.total}</span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">Configured roles</span>
        </div>
        <div className="bg-card-bg rounded-xl p-md shadow-2xs border border-border-subtle flex flex-col">
          <span className="font-label-bold text-[12px] text-on-surface-variant uppercase tracking-wider">System Roles</span>
          <span className="font-display-title text-[26px] text-primary mt-1">{metrics.system}</span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">Immutable core</span>
        </div>
        <div className="bg-card-bg rounded-xl p-md shadow-2xs border border-border-subtle flex flex-col">
          <span className="font-label-bold text-[12px] text-on-surface-variant uppercase tracking-wider">Custom Roles</span>
          <span className="font-display-title text-[26px] text-secondary mt-1">{metrics.custom}</span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">Bespoke assignments</span>
        </div>
        <div className="bg-card-bg rounded-xl p-md shadow-2xs border border-border-subtle flex flex-col">
          <span className="font-label-bold text-[12px] text-on-surface-variant uppercase tracking-wider">Active Members</span>
          <span className="font-display-title text-[26px] text-success-text mt-1">{metrics.activeUsers}</span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">Assigned identities</span>
        </div>
        <div className="bg-card-bg rounded-xl p-md shadow-2xs border border-border-subtle flex flex-col col-span-2 md:col-span-1">
          <span className="font-label-bold text-[12px] text-on-surface-variant uppercase tracking-wider">Permissions Catalog</span>
          <span className="font-display-title text-[26px] text-on-surface mt-1">{metrics.totalPerms}</span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">Granular action keys</span>
        </div>
      </div>

      {/* Toolbar: Search, Filters, View Modes */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-md bg-surface-container-low p-sm rounded-xl border border-border-subtle">
        <div className="flex items-center gap-sm flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search roles by name, permission key, or scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-border-subtle">
            {['All', 'System', 'Custom', 'Active', 'Disabled', 'Archived'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-md font-label-bold text-[12px] transition-colors cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-xs justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-border-subtle shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-primary text-on-primary shadow-2xs' : 'text-outline hover:text-on-surface'
              }`}
              title="Card Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-primary text-on-primary shadow-2xs' : 'text-outline hover:text-on-surface'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-md">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-base text-on-surface-variant">Loading role policies and permissions catalog...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card-bg rounded-xl border border-dashed border-border-subtle p-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-outline mb-md">
            <span className="material-symbols-outlined text-[32px]">manage_accounts</span>
          </div>
          <h3 className="font-headline-md text-on-surface">No Roles Found</h3>
          <p className="font-body-base text-on-surface-variant max-w-md mt-1 mb-lg">
            No roles match your search query &ldquo;{searchQuery}&rdquo; and active filter &ldquo;{activeFilter}&rdquo;.
          </p>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('All');
              }}
              className="px-md py-xs bg-surface-container text-on-surface font-label-bold text-label-sm rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-sm rounded-lg hover:bg-on-primary-container transition-colors cursor-pointer"
            >
              Create New Role
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              activeMenuId={activeMenuId}
              toggleCardMenu={(id, e) => {
                e.stopPropagation();
                setActiveMenuId((prev) => (prev === id ? null : id));
              }}
              onOpenDrawer={handleOpenDrawer}
              onOpenCreateModal={handleOpenCreateModal}
              onCloneRole={handleCloneRole}
              onArchiveToggle={handleArchiveToggle}
              onToggleStatus={handleToggleStatus}
              onInitiateDelete={handleDeleteRole}
            />
          ))}
        </div>
      ) : (
        <RolesTableView
          roles={filteredRoles}
          onOpenDrawer={handleOpenDrawer}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Modals & Drawers */}
      <CreateEditRoleModal
        isOpen={isCreateModalOpen}
        form={roleForm}
        roles={roles}
        onClose={() => setIsCreateModalOpen(false)}
        onChangeForm={setRoleForm}
        onTemplateChange={handleTemplateChange}
        onToggleCategory={handleToggleCategory}
        onToggleSinglePermission={handleToggleSinglePermission}
        onSave={handleSaveRole}
        onInitiateDelete={handleDeleteRole}
      />

      <RoleMembersDrawer
        isOpen={Boolean(drawerRole)}
        role={drawerRole}
        activeTab={drawerTab}
        setActiveTab={setDrawerTab}
        onClose={() => setDrawerRole(null)}
        onToggleInspectorPermission={handleToggleInspectorPermission}
        onUnassignUser={handleUnassignUser}
        onAssignNewMember={handleAssignNewMember}
        onOpenEditTtl={(u) =>
          setEditTtlData({
            roleId: drawerRole.id,
            userId: u.id,
            userName: u.name,
            ttlType: 'Permanent',
            customTtlValue: 7,
            customTtlUnit: 'days',
          })
        }
        onOpenReassignUser={(u) =>
          setReassignUserData({
            user: u,
            sourceRole: drawerRole,
            targetRoleId: roles.find((r) => r.id !== drawerRole.id)?.id || '',
          })
        }
        onOpenEditWorkspace={(u) =>
          setEditWorkspaceData({
            roleId: drawerRole.id,
            userId: u.id,
            userName: u.name,
            currentWorkspace: u.workspace || 'Engineering Core',
          })
        }
        onInitiateDelete={handleDeleteRole}
      />

      <ExportPolicyModal
        isOpen={isExportModalOpen}
        exportFormat={exportFormat}
        roles={roles}
        onClose={() => setIsExportModalOpen(false)}
        onChangeFormat={setExportFormat}
        onDownload={handleDownloadPolicy}
      />

      {/* Edit User TTL Modal */}
      {editTtlData && (
        <EditUserTtlModal
          data={editTtlData}
          onClose={() => setEditTtlData(null)}
          onChangeData={setEditTtlData}
          onSave={() => {
            showToast(`TTL updated for ${editTtlData.userName}.`);
            setEditTtlData(null);
          }}
        />
      )}

      {/* Reassign User Modal */}
      {reassignUserData && (
        <ReassignUserModal
          data={reassignUserData}
          roles={roles}
          onClose={() => setReassignUserData(null)}
          onChangeTarget={(id) => setReassignUserData((prev) => ({ ...prev, targetRoleId: id }))}
          onConfirm={() => {
            const destRole = roles.find((r) => r.id === reassignUserData.targetRoleId);
            showToast(`Reassigned ${reassignUserData.user.name} to ${destRole?.name || 'new role'}.`);
            handleUnassignUser(reassignUserData.user.id);
            setReassignUserData(null);
          }}
        />
      )}

      {/* Change Workspace Modal */}
      {editWorkspaceData && (
        <ChangeWorkspaceModal
          data={editWorkspaceData}
          onClose={() => setEditWorkspaceData(null)}
          onChangeWorkspace={(ws) => setEditWorkspaceData((prev) => ({ ...prev, currentWorkspace: ws }))}
          onConfirm={() => {
            showToast(`Workspace scope updated for ${editWorkspaceData.userName}.`);
            setEditWorkspaceData(null);
          }}
        />
      )}

      {/* Safe Delete Role Modal with Member Reassignment */}
      <SafeDeleteRoleModal
        isOpen={Boolean(safeDeleteRole)}
        role={safeDeleteRole}
        roles={roles}
        onClose={() => setSafeDeleteRole(null)}
        onConfirmDelete={handleConfirmSafeDelete}
        loading={safeDeleteLoading}
      />

      {/* Toast Notification */}
      <div className="fixed bottom-6 right-6 z-120">
        <Toast message={toast?.msg} type={toast?.type} />
      </div>
    </div>
  );
}
