import { useState } from 'react';
import RoleMembersDrawerHeader from './RoleMembersDrawerHeader';
import RoleMembersDrawerTabs from './RoleMembersDrawerTabs';
import RolePermissionsTab from './RolePermissionsTab';
import RoleMembersTab from './RoleMembersTab';

export default function RoleMembersDrawer({
  isOpen,
  role,
  workspaces = [],
  activeTab,
  setActiveTab,
  onClose,
  onToggleInspectorPermission,
  onUnassignUser,
  onAssignNewMember,
  onOpenEditTtl,
  onOpenReassignUser,
  onOpenEditWorkspace,
  onInitiateDelete,
}) {
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const defaultWs = workspaces.length > 0 ? (typeof workspaces[0] === 'string' ? workspaces[0] : workspaces[0].name) : 'Default Workspace';
  const [assignFormData, setAssignFormData] = useState({
    name: '',
    email: '',
    workspace: defaultWs,
    ttlType: 'Permanent',
    customTtlValue: 7,
    customTtlUnit: 'days',
  });

  if (!isOpen || !role) return null;

  const assignedUsers = role.assignedUsers || [];
  const drawerFilteredUsers = assignedUsers.filter((u) => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.workspace || '').toLowerCase().includes(q)
    );
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onAssignNewMember(assignFormData);
    setAssignFormData({
      name: '',
      email: '',
      workspace: defaultWs,
      ttlType: 'Permanent',
      customTtlValue: 7,
      customTtlUnit: 'days',
    });
    setIsAssignFormOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[999]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-full sm:w-[500px] bg-card-bg shadow-2xl flex flex-col justify-between border-l border-border-subtle z-[1000] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <RoleMembersDrawerHeader role={role} onClose={onClose} />

        <RoleMembersDrawerTabs role={role} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'members' ? (
          <RoleMembersTab
            role={role}
            users={drawerFilteredUsers}
            searchQuery={memberSearchQuery}
            onSearchChange={setMemberSearchQuery}
            isAssignFormOpen={isAssignFormOpen}
            onToggleAssignForm={() => setIsAssignFormOpen((prev) => !prev)}
            assignFormData={assignFormData}
            onAssignFormChange={setAssignFormData}
            workspaces={workspaces}
            defaultWorkspace={defaultWs}
            onSubmitAssign={handleFormSubmit}
            onOpenEditWorkspace={onOpenEditWorkspace}
            onOpenEditTtl={onOpenEditTtl}
            onOpenReassignUser={onOpenReassignUser}
            onUnassignUser={onUnassignUser}
          />
        ) : (
          <RolePermissionsTab
            role={role}
            onToggleInspectorPermission={onToggleInspectorPermission}
          />
        )}

        <div className="p-md bg-surface-container-low border-t border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-sm">
            {role.type === 'custom' && (
              <button
                type="button"
                className="h-8 px-xs rounded-lg hover:bg-error-bg text-error-text font-label-bold text-[12px] flex items-center gap-1 transition-colors cursor-pointer border border-transparent hover:border-error-text/30"
                onClick={() => {
                  onClose();
                  onInitiateDelete(role);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete Role</span>
              </button>
            )}
            <span className="font-body-sm text-on-surface-variant text-[12px]">
              {activeTab === 'members'
                ? `Showing ${drawerFilteredUsers.length} of ${role.assignedUsers?.length || role.members} users`
                : `${role.permissionKeys?.length || role.perms} active permissions`}
            </span>
          </div>
          <button
            className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
