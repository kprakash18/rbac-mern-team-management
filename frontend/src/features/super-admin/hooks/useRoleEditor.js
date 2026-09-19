import { useState } from 'react';
import { permissionsByCategory } from '@/constants';
import * as rolesApi from '../api/rolesApi';

const emptyRoleForm = {
  id: null,
  name: '',
  description: '',
  selectedPermissions: new Set(),
  template: 'none',
  searchPermQuery: '',
};

export function useRoleEditor({ dbPermissions, setRoles, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyRoleForm);

  const openModal = (roleToEdit = null) => {
    if (roleToEdit) {
      setForm({
        id: roleToEdit.id,
        name: roleToEdit.name,
        description: roleToEdit.desc || roleToEdit.subtitle || '',
        selectedPermissions: new Set(roleToEdit.permissionKeys || []),
        template: 'none',
        searchPermQuery: '',
      });
    } else {
      setForm({
        id: null,
        name: '',
        description: '',
        selectedPermissions: new Set(rolesApi.ROLE_TEMPLATES.developer),
        template: 'developer',
        searchPermQuery: '',
      });
    }
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const cloneRole = (roleToClone) => {
    setForm({
      id: null,
      name: `${roleToClone.name} (Copy)`,
      description: roleToClone.desc || roleToClone.subtitle || '',
      selectedPermissions: new Set(roleToClone.permissionKeys || []),
      template: 'none',
      searchPermQuery: '',
    });
    setIsOpen(true);
    showToast(`Template initialized from "${roleToClone.name}".`);
  };

  const handleTemplateChange = (templateKey) => {
    const permList = rolesApi.ROLE_TEMPLATES[templateKey] || [];
    setForm((prev) => ({
      ...prev,
      template: templateKey,
      selectedPermissions: new Set(permList),
    }));
  };

  const toggleCategory = (categoryKey, selectAll) => {
    const categoryPerms = permissionsByCategory[categoryKey] || [];
    setForm((prev) => {
      const nextSet = new Set(prev.selectedPermissions);
      categoryPerms.forEach((permission) => {
        if (selectAll) {
          nextSet.add(permission.key);
        } else {
          nextSet.delete(permission.key);
        }
      });
      return { ...prev, selectedPermissions: nextSet };
    });
  };

  const toggleSinglePermission = (permissionKey) => {
    setForm((prev) => {
      const nextSet = new Set(prev.selectedPermissions);
      if (nextSet.has(permissionKey)) {
        nextSet.delete(permissionKey);
      } else {
        nextSet.add(permissionKey);
      }
      return { ...prev, selectedPermissions: nextSet };
    });
  };

  const saveRole = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    const selectedKeys = Array.from(form.selectedPermissions);
    const permIdMap = new Map(dbPermissions.map((permission) => [permission.key, permission._id || permission.id]));
    const permissionIds = selectedKeys.map((key) => permIdMap.get(key)).filter(Boolean);

    try {
      if (form.id) {
        const updatedData = await rolesApi.updateRole(form.id, {
          name: form.name,
          description: form.description,
          permissionIds,
        });

        const updatedRole = rolesApi.formatRole(
          updatedData || {
            ...form,
            permissions: selectedKeys,
          }
        );

        setRoles((prev) => prev.map((role) => (role.id === form.id ? updatedRole : role)));
        showToast(`Role "${form.name}" updated successfully.`);
        setIsOpen(false);
      } else {
        let createdRoleData = null;
        try {
          createdRoleData = await rolesApi.createRole({
            name: form.name,
            description: form.description,
            permissionIds,
          });
        } catch (apiErr) {
          const msg = apiErr.response?.data?.message || 'Failed to create role on server.';
          showToast(msg, 'error');
          return;
        }

        const newFormattedRole = rolesApi.formatRole(
          createdRoleData || {
            id: `role-${Date.now()}`,
            name: form.name,
            description: form.description,
            isSystemRole: false,
            status: 'ACTIVE',
            permissions: selectedKeys,
            assignedUsers: [],
          }
        );

        setRoles((prev) => [newFormattedRole, ...prev]);
        showToast(`Role "${form.name}" created and deployed.`);
        setIsOpen(false);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Operation failed.';
      showToast(errMsg, 'error');
    }
  };

  return {
    isOpen,
    form,
    setForm,
    openModal,
    closeModal,
    cloneRole,
    handleTemplateChange,
    toggleCategory,
    toggleSinglePermission,
    saveRole,
  };
}
