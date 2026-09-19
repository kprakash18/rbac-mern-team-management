import { useState, useEffect, useCallback } from 'react';
import RoleCatalogHeader from './roles/RoleCatalogHeader';
import RoleMetricsGrid from './roles/RoleMetricsGrid';
import RolesToolbar from './roles/RolesToolbar';
import RolesDirectoryContent from './roles/RolesDirectoryContent';
import CreateEditRoleModal from './roles/CreateEditRoleModal';
import RoleMembersDrawer from './roles/RoleMembersDrawer';
import ExportPolicyModal from './roles/ExportPolicyModal';
import EditUserTtlModal from './roles/EditUserTtlModal';
import ReassignUserModal from './roles/ReassignUserModal';
import ChangeWorkspaceModal from './roles/ChangeWorkspaceModal';
import SafeDeleteRoleModal from './roles/SafeDeleteRoleModal';
import { Toast } from '@/shared/components';
import { useToast } from '../../../lib/useToast';
import { useRolesDirectory } from '../hooks/useRolesDirectory';
import { useRoleEditor } from '../hooks/useRoleEditor';
import { useRolePolicyExport } from '../hooks/useRolePolicyExport';
import { useRoleLifecycle } from '../hooks/useRoleLifecycle';
import * as rolesApi from '../api/rolesApi';

export default function RolesView() {
  const [roles, setRoles] = useState([]);
  const [dbPermissions, setDbPermissions] = useState([]);
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeMenuId, setActiveMenuId] = useState(null);

  const [drawerRole, setDrawerRole] = useState(null);
  const [drawerTab, setDrawerTab] = useState('permissions');

  const [editTtlData, setEditTtlData] = useState(null);
  const [reassignUserData, setReassignUserData] = useState(null);
  const [editWorkspaceData, setEditWorkspaceData] = useState(null);

  const [toast, showToast] = useToast(3500);
  const directory = useRolesDirectory(roles);
  const roleEditor = useRoleEditor({ dbPermissions, setRoles, showToast });
  const policyExport = useRolePolicyExport({ roles, showToast });
  const roleLifecycle = useRoleLifecycle({
    roles,
    setRoles,
    drawerRole,
    setDrawerRole,
    showToast,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getRolesCatalogData();
      setDbPermissions(data.permissions);
      setAvailableWorkspaces(data.workspaces);
      setRoles(data.roles);
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

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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
      const updatedData = await rolesApi.updateRole(drawerRole.id, {
        name: drawerRole.name,
        description: drawerRole.description,
        permissionIds,
      });

      const updatedRole = rolesApi.formatRole(
        updatedData || {
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
    const updatedRole = rolesApi.formatRole({
      ...drawerRole,
      assignedUsers: nextUsers,
    });

    setDrawerRole(updatedRole);
    setRoles((prev) => prev.map((r) => (r.id === drawerRole.id ? updatedRole : r)));
    showToast(`User assignment removed from ${drawerRole.name}.`);
  };

  const handleAssignNewMember = (formData) => {
    if (!drawerRole) return;

    const defaultWorkspaceName = availableWorkspaces[0]?.name || 'Global Platform';
    const newUser = {
      id: `user-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      workspace: formData.workspace || defaultWorkspaceName,
      assignedAt: new Date().toISOString(),
      expiresAt:
        formData.ttlType === 'Permanent'
          ? null
          : new Date(Date.now() + (formData.customTtlValue || 7) * 86400000).toISOString(),
    };

    const nextUsers = [newUser, ...drawerRole.assignedUsers];
    const updatedRole = rolesApi.formatRole({
      ...drawerRole,
      assignedUsers: nextUsers,
    });

    setDrawerRole(updatedRole);
    setRoles((prev) => prev.map((r) => (r.id === drawerRole.id ? updatedRole : r)));
    showToast(`Assigned ${formData.name} to ${drawerRole.name}.`);
  };

  return (
    <div className="flex flex-col w-full p-xl gap-xl">
      <RoleCatalogHeader
        onExportPolicies={policyExport.openModal}
        onCreateRole={() => roleEditor.openModal()}
      />

      <RoleMetricsGrid metrics={directory.metrics} />

      <RolesToolbar
        searchQuery={directory.searchQuery}
        onSearchChange={directory.setSearchQuery}
        activeFilter={directory.activeFilter}
        onFilterChange={directory.setActiveFilter}
        viewMode={directory.viewMode}
        onViewModeChange={directory.setViewMode}
      />

      <RolesDirectoryContent
        loading={loading}
        roles={directory.filteredRoles}
        searchQuery={directory.searchQuery}
        activeFilter={directory.activeFilter}
        viewMode={directory.viewMode}
        activeMenuId={activeMenuId}
        onToggleCardMenu={(event, id) => {
          event.stopPropagation();
          setActiveMenuId((prev) => (prev === id ? null : id));
        }}
        onClearFilters={directory.clearFilters}
        onCreateRole={() => roleEditor.openModal()}
        onOpenDrawer={handleOpenDrawer}
        onOpenCreateModal={roleEditor.openModal}
        onCloneRole={roleEditor.cloneRole}
        onArchiveToggle={roleLifecycle.toggleArchive}
        onToggleStatus={roleLifecycle.toggleStatus}
        onInitiateDelete={roleLifecycle.initiateDelete}
      />

      <CreateEditRoleModal
        isOpen={roleEditor.isOpen}
        form={roleEditor.form}
        roles={roles}
        onClose={roleEditor.closeModal}
        onChangeForm={roleEditor.setForm}
        onTemplateChange={roleEditor.handleTemplateChange}
        onToggleCategory={roleEditor.toggleCategory}
        onToggleSinglePermission={roleEditor.toggleSinglePermission}
        onSave={roleEditor.saveRole}
        onInitiateDelete={roleLifecycle.initiateDelete}
      />

      <RoleMembersDrawer
        isOpen={Boolean(drawerRole)}
        role={drawerRole}
        workspaces={availableWorkspaces}
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
            currentWorkspace: u.workspace || availableWorkspaces[0]?.name || 'Global Platform',
          })
        }
        onInitiateDelete={roleLifecycle.initiateDelete}
      />

      <ExportPolicyModal
        isOpen={policyExport.isOpen}
        exportFormat={policyExport.format}
        roles={roles}
        onClose={policyExport.closeModal}
        onChangeFormat={policyExport.setFormat}
        onDownload={policyExport.downloadPolicy}
      />

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

      <SafeDeleteRoleModal
        isOpen={Boolean(roleLifecycle.safeDeleteRole)}
        role={roleLifecycle.safeDeleteRole}
        roles={roles}
        onClose={() => roleLifecycle.setSafeDeleteRole(null)}
        onConfirmDelete={roleLifecycle.confirmSafeDelete}
        loading={roleLifecycle.safeDeleteLoading}
      />

      <div className="fixed bottom-6 right-6 z-120">
        <Toast message={toast?.msg} type={toast?.type} />
      </div>
    </div>
  );
}
