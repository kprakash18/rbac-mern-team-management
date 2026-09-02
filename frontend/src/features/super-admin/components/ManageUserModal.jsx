import { useState } from 'react';
import { WORKSPACE_ROLES_MAP } from '../constants/superAdmin.constants';

const WORKSPACE_ICONS = {
  'Research & Development': 'biotech',
  'Engineering Core': 'dns',
  Engineering: 'dns',
  'Marketing Global': 'campaign',
  Marketing: 'campaign',
  'Finance Secure': 'payments',
  'Customer Support EU': 'support_agent',
  Production: 'precision_manufacturing',
  Staging: 'tune',
  Product: 'category',
  Design: 'palette',
};

export default function ManageUserModal({ isOpen, user, onClose, onSaveUser }) {
  const [accountStatus, setAccountStatus] = useState(
    () => user?.statusType || user?.status?.toLowerCase() || 'active'
  );
  const [workspaces, setWorkspaces] = useState(
    () =>
      user?.workspaces?.map((w) => ({
        name: w.name,
        role: w.role || (WORKSPACE_ROLES_MAP[w.name] ? WORKSPACE_ROLES_MAP[w.name][0] : 'Developer'),
      })) || []
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => Boolean(user?.isSuperAdmin));
  const [mustChangePassword, setMustChangePassword] = useState(() => Boolean(user?.mustChangePassword));
  const [sessionsTerminated, setSessionsTerminated] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  if (!isOpen || !user) return null;

  const handleAddWorkspace = () => {
    const availableWorkspaces = Object.keys(WORKSPACE_ROLES_MAP);
    const nextWorkspace =
      availableWorkspaces.find((ws) => !workspaces.some((w) => w.name === ws)) ||
      availableWorkspaces[0];

    const defaultRole = WORKSPACE_ROLES_MAP[nextWorkspace]?.[0] || 'Viewer';

    setWorkspaces((prev) => [
      ...prev,
      {
        name: nextWorkspace,
        role: defaultRole,
      },
    ]);
  };

  const handleStatusChangeRequest = (newStatus) => {
    if (newStatus === accountStatus) return;

    if (newStatus === 'suspended') {
      setConfirmModal({
        title: 'Suspend User Account?',
        message: `Are you sure you want to suspend ${user.name}? This will immediately block their login and freeze their access across all workspaces.`,
        icon: 'pause_circle',
        confirmButtonText: 'Yes, Suspend Account',
        confirmButtonClass: 'bg-error text-on-error hover:opacity-90',
        onConfirm: () => {
          setAccountStatus('suspended');
          setConfirmModal(null);
        },
      });
    } else if (newStatus === 'disabled') {
      setConfirmModal({
        title: 'Deactivate / Disable User Account?',
        message: `Are you sure you want to disable ${user.name}? This will permanently revoke platform access while keeping historical records intact.`,
        icon: 'block',
        confirmButtonText: 'Yes, Disable Account',
        confirmButtonClass: 'bg-error text-on-error hover:opacity-90',
        onConfirm: () => {
          setAccountStatus('disabled');
          setConfirmModal(null);
        },
      });
    } else if (accountStatus === 'suspended' || accountStatus === 'disabled') {
      setConfirmModal({
        title: 'Reactivate User Account?',
        message: `Are you sure you want to reactivate ${user.name}? They will be able to log in and access their assigned workspaces again.`,
        icon: 'check_circle',
        confirmButtonText: 'Yes, Reactivate',
        confirmButtonClass: 'bg-success-text text-on-primary hover:opacity-90',
        onConfirm: () => {
          setAccountStatus(newStatus);
          setConfirmModal(null);
        },
      });
    } else {
      setAccountStatus(newStatus);
    }
  };

  const handleRemoveWorkspaceRequest = (index) => {
    const targetWs = workspaces[index];
    const wsName = targetWs ? targetWs.name : 'this workspace';

    setConfirmModal({
      title: 'Remove Workspace Access?',
      message: `Are you sure you want to remove ${user.name}'s access to "${wsName}"? They will lose their role permissions for this team.`,
      icon: 'delete',
      confirmButtonText: 'Yes, Remove Access',
      confirmButtonClass: 'bg-error text-on-error hover:opacity-90',
      onConfirm: () => {
        setWorkspaces((prev) => prev.filter((_, i) => i !== index));
        setConfirmModal(null);
      },
    });
  };

  const handleRoleChange = (index, newRole) => {
    setWorkspaces((prev) =>
      prev.map((w, i) => (i === index ? { ...w, role: newRole } : w))
    );
  };

  const handleForceLogout = () => {
    setSessionsTerminated(true);
  };

  const handleSave = () => {
    const statusMap = {
      active: 'Active',
      suspended: 'Suspended',
      disabled: 'Disabled',
      invited: 'Invited',
    };

    const updatedUser = {
      ...user,
      status: statusMap[accountStatus] || 'Active',
      statusType: accountStatus,
      workspaces: workspaces.map((w) => ({
        name: w.name,
        role: w.role,
        isHigh: false,
      })),
      isSuperAdmin,
      mustChangePassword,
      lastLogoutAt: sessionsTerminated ? new Date().toISOString() : user.lastLogoutAt,
    };

    if (onSaveUser) {
      onSaveUser(updatedUser);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-on-primary-fixed/40 backdrop-blur-sm p-md">
      {/* Modal Card */}
      <div className="w-full max-w-160 flex flex-col bg-surface-container-lowest rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-lg pb-md bg-surface-container-lowest shadow-sm z-10 relative border-b border-border-subtle">
          <h2 className="font-headline-md text-on-surface">Manage User: {user.name}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-surface-container transition-colors text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex flex-col flex-1 overflow-y-auto p-lg gap-xl">
          {/* User Summary */}
          <div className="flex items-center gap-md bg-surface-container-low p-md rounded-lg shadow-sm">
            {user.avatar ? (
              <img
                className="w-12 h-12 rounded-full object-cover shadow-sm"
                src={user.avatar}
                alt={user.name}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-bold shadow-sm">
                {user.initials}
              </div>
            )}
            <div className="flex flex-col flex-1 gap-base">
              <div className="flex items-center gap-xs">
                <span className="font-label-bold text-on-surface">{user.name}</span>
                {isSuperAdmin && (
                  <span className="material-symbols-outlined text-warning-text text-[16px]" title="Platform Super Admin">
                    local_police
                  </span>
                )}
              </div>
              <span className="font-body-sm text-on-surface-variant">{user.email}</span>
            </div>
            {accountStatus === 'active' && (
              <span className="px-sm py-base bg-success-bg text-success-text font-label-bold rounded-full text-center text-[12px]">
                Active
              </span>
            )}
            {accountStatus === 'invited' && (
              <span className="px-sm py-base bg-warning-bg text-warning-text font-label-bold rounded-full text-center text-[12px]">
                Invited
              </span>
            )}
            {accountStatus === 'suspended' && (
              <span className="px-sm py-base bg-error-bg text-error-text font-label-bold rounded-full text-center text-[12px]">
                Suspended
              </span>
            )}
            {accountStatus === 'disabled' && (
              <span className="px-sm py-base bg-surface-container-high text-on-surface-variant font-label-bold rounded-full text-center text-[12px]">
                Disabled
              </span>
            )}
          </div>

          {/* Account Status */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-bold text-on-surface">Account Status</label>
            <div className="relative w-full md:w-1/2">
              <select
                value={accountStatus}
                onChange={(e) => handleStatusChangeRequest(e.target.value)}
                className="w-full appearance-none bg-surface-container text-on-surface font-body-base p-sm pr-xl rounded-lg outline-none focus:shadow-md transition-shadow shadow-sm cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="disabled">Disabled</option>
                <option value="invited">Invited</option>
              </select>
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Workspaces & Roles */}
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <label className="font-label-bold text-on-surface">Workspaces &amp; Roles</label>
              <button
                type="button"
                onClick={handleAddWorkspace}
                className="flex items-center gap-xs px-sm py-base bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-bold rounded-lg shadow-sm transition-colors text-[13px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Workspace
              </button>
            </div>

            <div className="flex flex-col gap-sm">
              {workspaces.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant bg-surface-container rounded-lg font-body-sm">
                  No workspaces assigned yet. Click "Add Workspace" to assign.
                </div>
              ) : (
                workspaces.map((ws, index) => {
                  const icon = WORKSPACE_ICONS[ws.name] || 'corporate_fare';
                  const availableRoles = WORKSPACE_ROLES_MAP[ws.name] || ['Admin', 'Developer', 'Viewer'];

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-md bg-surface-container rounded-lg shadow-sm"
                    >
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">{icon}</span>
                        </div>
                        <span className="font-label-bold text-on-surface">{ws.name}</span>
                      </div>
                      <div className="flex items-center gap-md">
                        <div className="relative w-36">
                          <select
                            value={ws.role}
                            onChange={(e) => handleRoleChange(index, e.target.value)}
                            className="w-full appearance-none bg-surface-container-lowest text-on-surface font-body-sm py-xs pl-sm pr-lg rounded shadow-sm outline-none cursor-pointer"
                          >
                            {availableRoles.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-xs top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">
                            arrow_drop_down
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove role"
                          onClick={() => handleRemoveWorkspaceRequest(index)}
                          className="p-xs text-error hover:bg-error-container/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Platform Authority */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-bold text-on-surface">Platform Authority</label>
            <div className="flex items-start gap-sm p-md bg-surface-container-low rounded-lg shadow-sm">
              <div className="relative flex items-center mt-0.5">
                <input
                  className="peer appearance-none w-5 h-5 bg-surface-container-lowest shadow-sm rounded cursor-pointer checked:bg-primary transition-colors border border-border-subtle"
                  id="super-admin-cb"
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                />
                <span className="material-symbols-outlined absolute inset-0 text-on-primary text-[18px] opacity-0 peer-checked:opacity-100 pointer-events-none flex items-center justify-center font-bold">
                  check
                </span>
              </div>
              <div className="flex flex-col gap-base">
                <label className="font-label-bold text-on-surface cursor-pointer select-none" htmlFor="super-admin-cb">
                  Grant Platform Super Admin Privileges
                </label>
                <p className="font-body-sm text-on-surface-variant">
                  Gives unrestricted wildcard access to platform settings &amp; all teams.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Sessions */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-bold text-on-surface">Security &amp; Sessions</label>
            <div className="flex flex-col gap-md p-md bg-surface-container-low rounded-lg shadow-sm">
              <div className="flex items-start gap-sm">
                <div className="relative flex items-center mt-0.5">
                  <input
                    className="peer appearance-none w-5 h-5 bg-surface-container-lowest shadow-sm rounded cursor-pointer checked:bg-primary transition-colors border border-border-subtle"
                    id="pw-reset-cb"
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                  />
                  <span className="material-symbols-outlined absolute inset-0 text-on-primary text-[18px] opacity-0 peer-checked:opacity-100 pointer-events-none flex items-center justify-center font-bold">
                    check
                  </span>
                </div>
                <label className="font-label-bold text-on-surface cursor-pointer select-none" htmlFor="pw-reset-cb">
                  Force password reset on next login
                </label>
              </div>
              <div className="w-full h-px bg-surface-variant my-xs"></div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-base">
                  <span className="font-label-bold text-error">Terminate Sessions</span>
                  <span className="font-body-sm text-on-surface-variant">
                    {sessionsTerminated
                      ? 'Sessions will be invalidated upon saving.'
                      : 'Invalidates all active sessions immediately.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleForceLogout}
                  className={`px-md py-sm rounded-lg shadow-sm transition-colors flex items-center gap-xs font-label-bold cursor-pointer ${
                    sessionsTerminated
                      ? 'bg-success-bg text-success-text'
                      : 'bg-error-container hover:bg-error-bg text-on-error-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {sessionsTerminated ? 'check' : 'logout'}
                  </span>
                  {sessionsTerminated ? 'Terminated' : 'Force Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-sm p-lg bg-surface-container-low shadow-[0_-1px_3px_rgba(0,0,0,0.05)] relative z-10 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-lg py-sm bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-lg py-sm bg-primary hover:bg-surface-tint text-on-primary font-label-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      {confirmModal && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-xs p-md animate-in fade-in duration-150">
          <div className="w-full max-w-110 bg-surface-container-lowest rounded-xl shadow-2xl p-lg flex flex-col gap-md border border-border-subtle animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-md">
              <div className="w-10 h-10 rounded-full bg-error-container/60 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  {confirmModal.icon || 'warning'}
                </span>
              </div>
              <div className="flex flex-col gap-xs flex-1">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  {confirmModal.title}
                </h3>
                <p className="font-body-base text-body-base text-on-surface-variant leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-sm mt-sm">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-md py-sm rounded-lg border border-border-subtle bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold text-label-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-md py-sm rounded-lg font-label-bold text-label-sm shadow-sm transition-all cursor-pointer ${
                  confirmModal.confirmButtonClass || 'bg-error text-on-error'
                }`}
              >
                {confirmModal.confirmButtonText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
