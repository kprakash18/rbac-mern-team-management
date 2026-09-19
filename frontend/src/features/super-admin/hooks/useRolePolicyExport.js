import { useState } from 'react';

export function useRolePolicyExport({ roles, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState('opa');

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const downloadPolicy = () => {
    let fileContent = '';
    let fileName = `rbac-policy-bundle-${Date.now()}`;
    let mimeType = 'text/plain';

    if (format === 'opa') {
      fileName += '.rego';
      fileContent = 'package rbac.authz\n\ndefault allow = false\n\n# Canonical Role Definitions\n';
      roles.forEach((role) => {
        fileContent += `# Role: ${role.name} (${role.type.toUpperCase()})\n`;
        fileContent += `allow {\n  input.role == "${role.name}"\n  input.action in [${role.permissionKeys.map((key) => `"${key}"`).join(', ')}]\n}\n\n`;
      });
    } else if (format === 'json') {
      fileName += '.json';
      mimeType = 'application/json';
      fileContent = JSON.stringify(
        roles.map((role) => ({
          id: role.id,
          name: role.name,
          type: role.type,
          status: role.status,
          permissionsCount: role.permissionKeys.length,
          permissions: role.permissionKeys,
          membersCount: role.assignedUsers.length,
          members: role.assignedUsers.map((user) => ({
            name: user.name,
            email: user.email,
            workspace: user.workspace,
          })),
        })),
        null,
        2
      );
    } else if (format === 'csv') {
      fileName += '.csv';
      mimeType = 'text/csv';
      fileContent = 'Role ID,Name,Type,Status,Permissions Count,Members Count,Permissions\n';
      roles.forEach((role) => {
        fileContent += `"${role.id}","${role.name}","${role.type}","${role.status}",${role.permissionKeys.length},${role.assignedUsers.length},"${role.permissionKeys.join(';')}"\n`;
      });
    } else if (format === 'aws') {
      fileName += '.json';
      mimeType = 'application/json';
      fileContent = JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: roles.map((role) => ({
            Sid: role.name.replace(/[^a-zA-Z0-9]/g, ''),
            Effect: 'Allow',
            Action: role.permissionKeys,
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

    setIsOpen(false);
    showToast(`Exported ${format.toUpperCase()} policy bundle successfully.`);
  };

  return {
    isOpen,
    format,
    setFormat,
    openModal,
    closeModal,
    downloadPolicy,
  };
}
