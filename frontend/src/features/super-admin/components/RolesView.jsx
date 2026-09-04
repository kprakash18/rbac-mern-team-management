import { useState, useEffect } from 'react';
import {
  CANONICAL_PERMISSIONS,
  INITIAL_ROLES,
} from '@/constants';
import RoleCard from './roles/RoleCard.jsx';
import RolesTableView from './roles/RolesTableView.jsx';
import RoleMembersDrawer from './roles/RoleMembersDrawer.jsx';
import CreateEditRoleModal from './roles/CreateEditRoleModal.jsx';
import ConfirmModal from '../../../components/shared/ConfirmModal.jsx';
import ExportPolicyModal from './roles/ExportPolicyModal.jsx';
import EditUserTtlModal from './roles/EditUserTtlModal.jsx';
import ReassignUserModal from './roles/ReassignUserModal.jsx';
import ChangeWorkspaceModal from './roles/ChangeWorkspaceModal.jsx';

export default function RolesView() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('members-desc');
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals & Drawer State
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
  const [selectedRoleForMembers, setSelectedRoleForMembers] = useState(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState('members');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    id: null,
    name: '',
    description: '',
    template: 'none',
    selectedPermissions: new Set(['user.read', 'team.read', 'task.read']),
    searchPermQuery: '',
    activePermCategory: 'ALL',
  });

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('opa');
  const [deleteConfirmData, setDeleteConfirmData] = useState(null);

  // User Lifecycle Modals
  const [editingUserTtl, setEditingUserTtl] = useState(null);
  const [reassigningUser, setReassigningUser] = useState(null);
  const [editingUserWorkspace, setEditingUserWorkspace] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Filter & Sort Logic
  const filteredRoles = roles
    .filter((role) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        role.name.toLowerCase().includes(q) ||
        (role.desc && role.desc.toLowerCase().includes(q)) ||
        (role.subtitle && role.subtitle.toLowerCase().includes(q));

      let matchesType = true;
      if (roleTypeFilter === 'system') matchesType = role.type === 'system' && role.status !== 'archived';
      if (roleTypeFilter === 'custom') matchesType = role.type === 'custom' && role.status !== 'archived';
      if (roleTypeFilter === 'archived') matchesType = role.status === 'archived' || role.isArchived;

      let matchesScope = true;
      if (scopeFilter === 'wildcard') matchesScope = role.scopeType === 'wildcard';
      if (scopeFilter === 'scoped') matchesScope = role.scopeType === 'standard';

      return matchesSearch && matchesType && matchesScope;
    })
    .sort((a, b) => {
      if (sortBy === 'members-desc') return b.members - a.members;
      if (sortBy === 'members-asc') return a.members - b.members;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'perms-desc') return (b.permissionKeys?.length || b.perms) - (a.permissionKeys?.length || a.perms);
      return 0;
    });

  const toggleCardMenu = (e, menuId) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === menuId ? null : menuId);
  };

  const handleOpenMemberDrawer = (role, initialTab = 'members') => {
    setSelectedRoleForMembers(role);
    setDrawerActiveTab(initialTab);
    setIsMemberDrawerOpen(true);
  };

  const handleToggleRoleStatus = (roleId) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === roleId) {
          const nextStatus = r.status === 'disabled' ? 'active' : 'disabled';
          const updated = { ...r, status: nextStatus };
          if (selectedRoleForMembers && selectedRoleForMembers.id === roleId) {
            setSelectedRoleForMembers(updated);
          }
          showToast(`Role "${r.name}" is now ${nextStatus.toUpperCase()}.`);
          return updated;
        }
        return r;
      })
    );
    setActiveMenuId(null);
  };

  const handleArchiveToggle = (roleId) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === roleId) {
          const isArch = r.status === 'archived';
          return { ...r, status: isArch ? 'active' : 'archived', isArchived: !isArch };
        }
        return r;
      })
    );
    setActiveMenuId(null);
    showToast('Role status updated.');
  };

  const handleCloneRole = (role) => {
    const clonedRole = {
      ...role,
      id: `custom-clone-${Date.now()}`,
      name: `${role.name} (Copy)`,
      type: 'custom',
      status: 'active',
      members: 0,
      assignedUsers: [],
      isArchived: false,
    };
    setRoles((prev) => [clonedRole, ...prev]);
    setActiveMenuId(null);
    showToast(`Cloned role "${clonedRole.name}" created.`);
  };

  const initiateDeleteRole = (role) => {
    setActiveMenuId(null);
    if (role.type === 'system') return;
    const otherRoles = roles.filter((r) => r.id !== role.id && r.status === 'active');
    setDeleteConfirmData({
      role,
      reassignmentTarget: otherRoles[0]?.id || 'dev',
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmData) return;
    const { role, reassignmentTarget } = deleteConfirmData;

    if (role.assignedUsers && role.assignedUsers.length > 0 && reassignmentTarget) {
      const targetRole = roles.find((r) => r.id === reassignmentTarget);
      if (targetRole) {
        const usersToMove = role.assignedUsers.map((u) => ({
          ...u,
          assignedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        }));
        setRoles((prev) =>
          prev.map((r) => {
            if (r.id === reassignmentTarget) {
              return {
                ...r,
                assignedUsers: [...(r.assignedUsers || []), ...usersToMove],
                members: (r.assignedUsers?.length || 0) + usersToMove.length,
              };
            }
            return r;
          })
        );
      }
    }

    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, status: 'archived', isArchived: true, assignedUsers: [], members: 0 } : r))
    );
    setDeleteConfirmData(null);
    showToast(`Custom role "${role.name}" was soft-archived.`);
  };

  // Create / Edit Role Modal Handlers
  const handleOpenCreateModal = (roleToEdit = null) => {
    setActiveMenuId(null);
    if (roleToEdit) {
      setCreateForm({
        id: roleToEdit.id,
        name: roleToEdit.name,
        description: roleToEdit.desc || '',
        template: 'none',
        selectedPermissions: new Set(roleToEdit.permissionKeys || []),
        searchPermQuery: '',
        activePermCategory: 'ALL',
      });
    } else {
      setCreateForm({
        id: null,
        name: '',
        description: '',
        template: 'none',
        selectedPermissions: new Set(['user.read', 'team.read', 'task.read']),
        searchPermQuery: '',
        activePermCategory: 'ALL',
      });
    }
    setIsCreateOpen(true);
  };

  const handleTemplateChange = (tmpl) => {
    let perms = new Set();
    if (tmpl === 'developer') {
      perms = new Set(['team.read', 'membership.read', 'role.read', 'permission.read', 'task.read', 'task.create', 'task.update', 'access_request.create', 'notification.read']);
    } else if (tmpl === 'ws-admin') {
      perms = new Set(['user.read', 'team.read', 'team.update', 'membership.read', 'membership.create', 'membership.update', 'role.read', 'role.assign', 'task.read', 'task.create', 'task.update', 'task.delete', 'audit.read']);
    } else if (tmpl === 'auditor') {
      perms = new Set(['team.read', 'membership.read', 'role.read', 'permission.read', 'audit.read', 'notification.read']);
    } else {
      perms = new Set(['user.read', 'team.read', 'task.read']);
    }
    setCreateForm((prev) => ({ ...prev, template: tmpl, selectedPermissions: perms }));
  };

  const handleToggleCategoryPermissions = (category, selectAll) => {
    const categoryPerms = CANONICAL_PERMISSIONS.filter((p) => p.category === category).map((p) => p.key);
    setCreateForm((prev) => {
      const next = new Set(prev.selectedPermissions);
      categoryPerms.forEach((key) => {
        if (selectAll) next.add(key);
        else next.delete(key);
      });
      return { ...prev, selectedPermissions: next };
    });
  };

  const handleToggleSinglePermission = (permKey) => {
    setCreateForm((prev) => {
      const next = new Set(prev.selectedPermissions);
      if (next.has(permKey)) next.delete(permKey);
      else next.add(permKey);
      return { ...prev, selectedPermissions: next };
    });
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    if (createForm.id) {
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id === createForm.id) {
            return {
              ...r,
              name: createForm.name,
              desc: createForm.description,
              permissionKeys: Array.from(createForm.selectedPermissions),
              perms: createForm.selectedPermissions.size,
            };
          }
          return r;
        })
      );
      showToast(`Role "${createForm.name}" updated successfully.`);
    } else {
      const newRole = {
        id: `custom-${Date.now()}`,
        name: createForm.name,
        type: 'custom',
        status: 'active',
        members: 0,
        perms: createForm.selectedPermissions.size,
        icon: 'tune',
        iconBg: 'bg-primary-container',
        desc: createForm.description || 'Custom tailored role with bespoke granular permissions.',
        scopeType: 'standard',
        scopeBadge: 'Scoped Namespace Access',
        subtitle: 'Bespoke custom role',
        avatars: [],
        permPills: [{ text: `${createForm.selectedPermissions.size} Permissions Attached` }],
        permissionKeys: Array.from(createForm.selectedPermissions),
        assignedUsers: [],
      };
      setRoles((prev) => [newRole, ...prev]);
      showToast(`Custom role "${newRole.name}" created.`);
    }
    setIsCreateOpen(false);
  };

  // User Assignment & Lifecycle Handlers
  const handleAssignNewMember = (formData) => {
    if (!selectedRoleForMembers || !formData.name || !formData.email) return;
    const initials = formData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const computedTtl =
      formData.ttlType === 'custom'
        ? `Expires in ${formData.customTtlValue} ${formData.customTtlUnit}`
        : formData.ttlType === 'Permanent'
        ? 'Permanent'
        : `Expires in ${formData.ttlType}`;

    const newUser = {
      id: `usr-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      workspace: formData.workspace,
      assignedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      ttl: computedTtl,
      initials,
      bg: 'bg-primary text-on-primary',
    };

    const updatedRole = {
      ...selectedRoleForMembers,
      assignedUsers: [newUser, ...(selectedRoleForMembers.assignedUsers || [])],
      members: (selectedRoleForMembers.assignedUsers?.length || 0) + 1,
    };

    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    setSelectedRoleForMembers(updatedRole);
    showToast(`User ${newUser.name} assigned to ${updatedRole.name}.`);
  };

  const handleUnassignUser = (userId) => {
    if (!selectedRoleForMembers) return;
    if (selectedRoleForMembers.id === 'super-admin' && (selectedRoleForMembers.assignedUsers?.length || 0) <= 1) {
      showToast('⚠️ Security Lockout Guard: The last remaining Super Admin cannot be removed.');
      return;
    }

    const updatedUsers = (selectedRoleForMembers.assignedUsers || []).filter((u) => u.id !== userId);
    const updatedRole = {
      ...selectedRoleForMembers,
      assignedUsers: updatedUsers,
      members: updatedUsers.length,
    };

    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    setSelectedRoleForMembers(updatedRole);
    showToast('User unassigned from role.');
  };

  const handleSaveUserTtl = () => {
    if (!editingUserTtl || !selectedRoleForMembers) return;
    const { userId, ttlType, customValue, customUnit } = editingUserTtl;
    const computedTtl =
      ttlType === 'custom'
        ? `Expires in ${customValue} ${customUnit}`
        : ttlType === 'Permanent'
        ? 'Permanent'
        : `Expires in ${ttlType}`;

    const updatedUsers = (selectedRoleForMembers.assignedUsers || []).map((u) =>
      u.id === userId ? { ...u, ttl: computedTtl } : u
    );
    const updatedRole = { ...selectedRoleForMembers, assignedUsers: updatedUsers };
    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    setSelectedRoleForMembers(updatedRole);
    setEditingUserTtl(null);
    showToast('TTL expiration updated.');
  };

  const handleConfirmReassignUser = () => {
    if (!reassigningUser) return;
    const { user, sourceRole, targetRoleId } = reassigningUser;
    const targetRole = roles.find((r) => r.id === targetRoleId);
    if (!targetRole) return;

    const sourceUsers = (sourceRole.assignedUsers || []).filter((u) => u.id !== user.id);
    const updatedSource = { ...sourceRole, assignedUsers: sourceUsers, members: sourceUsers.length };
    const movedUser = {
      ...user,
      assignedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    };
    const targetUsers = [movedUser, ...(targetRole.assignedUsers || [])];
    const updatedTarget = { ...targetRole, assignedUsers: targetUsers, members: targetUsers.length };

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === updatedSource.id) return updatedSource;
        if (r.id === updatedTarget.id) return updatedTarget;
        return r;
      })
    );

    if (selectedRoleForMembers?.id === sourceRole.id) setSelectedRoleForMembers(updatedSource);
    else if (selectedRoleForMembers?.id === targetRole.id) setSelectedRoleForMembers(updatedTarget);

    setReassigningUser(null);
    showToast(`Reassigned ${user.name} to ${targetRole.name}.`);
  };

  const handleConfirmChangeWorkspace = () => {
    if (!editingUserWorkspace || !selectedRoleForMembers) return;
    const { userId, currentWorkspace } = editingUserWorkspace;
    const updatedUsers = (selectedRoleForMembers.assignedUsers || []).map((u) =>
      u.id === userId ? { ...u, workspace: currentWorkspace } : u
    );
    const updatedRole = { ...selectedRoleForMembers, assignedUsers: updatedUsers };
    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    setSelectedRoleForMembers(updatedRole);
    setEditingUserWorkspace(null);
    showToast('Workspace scope updated.');
  };

  const handleToggleInspectorPermission = (permKey) => {
    if (!selectedRoleForMembers || selectedRoleForMembers.type === 'system') return;
    const currentKeys = new Set(selectedRoleForMembers.permissionKeys || []);
    if (currentKeys.has(permKey)) currentKeys.delete(permKey);
    else currentKeys.add(permKey);

    const updatedRole = {
      ...selectedRoleForMembers,
      permissionKeys: Array.from(currentKeys),
      perms: currentKeys.size,
    };
    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    setSelectedRoleForMembers(updatedRole);
  };

  const handleDownloadPolicy = () => {
    const activeRoles = roles.filter((r) => r.status === 'active');
    const filename = exportFormat === 'opa' ? 'platform_rbac_policy.rego' : 'platform_roles.tf';
    const content =
      exportFormat === 'opa'
        ? `package platform.authz\n\ndefault allow = false\n\nroles := ${JSON.stringify(
            activeRoles.map((r) => ({
              role: r.id,
              name: r.name,
              scopeType: r.scopeType,
              permissions: r.permissionKeys || [],
            })),
            null,
            2
          )}\n\nallow {\n  some role in input.user.roles\n  role == "super-admin"\n}\n`
        : activeRoles
            .map(
              (r) =>
                `resource "platform_role" "${r.id.replace(/-/g, '_')}" {\n  name        = "${r.name}"\n  description = "${r.desc}"\n  scope_type  = "${r.scopeType}"\n  permissions = ${JSON.stringify(r.permissionKeys || [])}\n}\n`
            )
            .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
    showToast(`Policy bundle downloaded (${filename}).`);
  };

  return (
    <div className="flex flex-col w-full p-xl gap-xl">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[1200] bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-xl shadow-2xl flex items-center gap-sm animate-in slide-in-from-top-4 duration-200 border border-inverse-on-surface/20">
          <span className="material-symbols-outlined text-[20px] text-primary">info</span>
          <span className="font-label-bold text-label-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Roles Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-md">
        <div className="flex flex-col gap-base">
          <h1 className="font-display-title text-display-title text-on-surface">Platform Roles &amp; RBAC</h1>
          <p className="font-body-base text-body-base text-on-surface-variant">
            Manage granular access policies, custom tenant roles, and member permission matrices.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            className="px-md py-sm rounded-lg bg-surface-container text-on-surface font-label-bold text-label-bold flex items-center gap-xs hover:bg-surface-container-high transition-colors cursor-pointer"
            onClick={() => setIsExportOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Policies</span>
          </button>
          <button
            className="px-md py-sm rounded-lg bg-primary text-on-primary font-label-bold text-label-bold flex items-center gap-xs hover:bg-on-primary-fixed transition-colors cursor-pointer shadow-xs"
            onClick={() => handleOpenCreateModal()}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-sm shadow-xs border border-surface-variant flex items-center justify-between gap-md overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-sm shrink-0">
          {/* Search Input */}
          <div className="relative w-64 shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-colors"
              placeholder="Search roles by title, key, or scope..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5 shrink-0">
            {['all', 'system', 'custom', 'archived'].map((t) => (
              <button
                key={t}
                onClick={() => setRoleTypeFilter(t)}
                className={`px-3 py-1 text-[12px] font-label-bold rounded-md capitalize transition-all cursor-pointer ${
                  roleTypeFilter === t
                    ? 'bg-card-bg text-on-surface shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t === 'all' ? 'All Roles' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-xs shrink-0">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="h-9 px-2.5 bg-surface-container-low rounded-lg text-[12px] font-label-bold text-on-surface border border-border-subtle focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="all">All Scopes</option>
            <option value="wildcard">Wildcard Scope</option>
            <option value="scoped">Scoped Namespaces</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-2.5 bg-surface-container-low rounded-lg text-[12px] font-label-bold text-on-surface border border-border-subtle focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="members-desc">Most Members</option>
            <option value="members-asc">Least Members</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="perms-desc">Permission Count</option>
          </select>
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-card-bg text-primary shadow-2xs' : 'text-outline hover:text-on-surface'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-card-bg text-primary shadow-2xs' : 'text-outline hover:text-on-surface'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Role Grid or Table View */}
      {filteredRoles.length === 0 ? (
        <div className="bg-card-bg rounded-xl p-2xl text-center border border-dashed border-border-subtle mb-xl">
          <span className="material-symbols-outlined text-[48px] text-outline mb-sm">shield</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">No roles match your search filters</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs max-w-md mx-auto">
            Try resetting your search query or switching the category filter back to "All Roles".
          </p>
          <button
            className="mt-md px-md py-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-label-bold text-label-sm rounded-lg transition-colors cursor-pointer"
            onClick={() => {
              setSearchQuery('');
              setRoleTypeFilter('all');
              setScopeFilter('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              activeMenuId={activeMenuId}
              toggleCardMenu={toggleCardMenu}
              onOpenDrawer={handleOpenMemberDrawer}
              onOpenCreateModal={handleOpenCreateModal}
              onCloneRole={handleCloneRole}
              onArchiveToggle={handleArchiveToggle}
              onToggleStatus={handleToggleRoleStatus}
              onInitiateDelete={initiateDeleteRole}
            />
          ))}
        </div>
      ) : (
        <RolesTableView
          roles={filteredRoles}
          onOpenDrawer={handleOpenMemberDrawer}
          onToggleStatus={handleToggleRoleStatus}
        />
      )}

      {/* 1. Slide-Over Drawer: Assigned Members & Permissions Matrix */}
      <RoleMembersDrawer
        isOpen={isMemberDrawerOpen}
        role={selectedRoleForMembers}
        activeTab={drawerActiveTab}
        setActiveTab={setDrawerActiveTab}
        onClose={() => setIsMemberDrawerOpen(false)}
        onToggleInspectorPermission={handleToggleInspectorPermission}
        onUnassignUser={handleUnassignUser}
        onAssignNewMember={handleAssignNewMember}
        onOpenEditTtl={(user) =>
          setEditingUserTtl({
            userId: user.id,
            userName: user.name,
            ttlType: user.ttl?.includes('Expires') ? 'custom' : 'Permanent',
            customValue: 30,
            customUnit: 'days',
          })
        }
        onOpenReassignUser={(user) =>
          setReassigningUser({
            user,
            sourceRole: selectedRoleForMembers,
            targetRoleId: roles.filter((r) => r.id !== selectedRoleForMembers.id && r.status === 'active')[0]?.id || 'dev',
          })
        }
        onOpenEditWorkspace={(user) =>
          setEditingUserWorkspace({
            userId: user.id,
            userName: user.name,
            currentWorkspace: user.workspace || 'Engineering Core',
          })
        }
        onInitiateDelete={initiateDeleteRole}
      />

      {/* 2. Create / Edit Role Modal */}
      <CreateEditRoleModal
        isOpen={isCreateOpen}
        form={createForm}
        roles={roles}
        onClose={() => setIsCreateOpen(false)}
        onChangeForm={setCreateForm}
        onTemplateChange={handleTemplateChange}
        onToggleCategory={handleToggleCategoryPermissions}
        onToggleSinglePermission={handleToggleSinglePermission}
        onSave={handleSaveRole}
        onInitiateDelete={initiateDeleteRole}
      />

      {/* 3. Delete Role Modal */}
      {deleteConfirmData && (
        <ConfirmModal
          isOpen={Boolean(deleteConfirmData)}
          title="Confirm Role Deletion"
          confirmText="Confirm & Delete Role"
          confirmVariant="danger"
          icon="warning"
          onClose={() => setDeleteConfirmData(null)}
          onConfirm={handleConfirmDelete}
        >
          <div className="space-y-3 text-[13px]">
            <p className="text-body-sm text-on-surface">
              Are you sure you want to delete and soft-archive custom role{' '}
              <strong className="text-on-surface font-semibold">"{deleteConfirmData.role.name}"</strong>?
            </p>

            {deleteConfirmData.role.assignedUsers && deleteConfirmData.role.assignedUsers.length > 0 ? (
              <div className="p-3 bg-warning-bg/40 border border-warning-text/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1 font-semibold text-[12px] text-warning-text">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  <span>Active Member Reassignment Required</span>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  There are <strong>{deleteConfirmData.role.assignedUsers.length} active users</strong> currently assigned to this role.
                  Select a target baseline role to reassign these users to before proceeding:
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                    Reassign Active Members To:
                  </label>
                  <select
                    value={deleteConfirmData.reassignmentTarget}
                    onChange={(e) =>
                      setDeleteConfirmData({ ...deleteConfirmData, reassignmentTarget: e.target.value })
                    }
                    className="w-full h-9 px-2 bg-surface-container-lowest rounded-lg text-body-sm text-on-surface border border-border-subtle focus:outline-none cursor-pointer"
                  >
                    {roles
                      .filter((r) => r.id !== deleteConfirmData.role.id && r.status === 'active')
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.scopeBadge || 'Scoped'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[16px]">check_circle</span>
                <span>No active users assigned to this role. It can be safely soft-archived.</span>
              </div>
            )}
          </div>
        </ConfirmModal>
      )}

      {/* 4. Export Policy Modal */}
      <ExportPolicyModal
        isOpen={isExportOpen}
        exportFormat={exportFormat}
        roles={roles}
        onClose={() => setIsExportOpen(false)}
        onChangeFormat={setExportFormat}
        onDownload={handleDownloadPolicy}
      />

      {/* 5. Edit TTL Modal */}
      <EditUserTtlModal
        data={editingUserTtl}
        onClose={() => setEditingUserTtl(null)}
        onChangeData={setEditingUserTtl}
        onSave={handleSaveUserTtl}
      />

      {/* 6. Reassign User Modal */}
      <ReassignUserModal
        data={reassigningUser}
        roles={roles}
        onClose={() => setReassigningUser(null)}
        onChangeTarget={(target) => setReassigningUser({ ...reassigningUser, targetRoleId: target })}
        onConfirm={handleConfirmReassignUser}
      />

      {/* 7. Change Workspace Scope Modal */}
      <ChangeWorkspaceModal
        data={editingUserWorkspace}
        onClose={() => setEditingUserWorkspace(null)}
        onChangeWorkspace={(ws) => setEditingUserWorkspace({ ...editingUserWorkspace, currentWorkspace: ws })}
        onConfirm={handleConfirmChangeWorkspace}
      />
    </div>
  );
}
