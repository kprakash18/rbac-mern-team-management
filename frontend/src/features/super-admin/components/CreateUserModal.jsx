import { useState } from 'react';

export default function CreateUserModal({ isOpen, onClose, onInvite }) {
  const [fullName, setFullName] = useState('Alice Vance');
  const [email, setEmail] = useState('alice@company.com');
  const [workspace, setWorkspace] = useState('Research & Development');
  const [role, setRole] = useState('Developer');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onInvite) {
      onInvite({ fullName, email, workspace, role, isSuperAdmin });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[580px] bg-surface-container-lowest rounded-xl shadow-xl border border-border-subtle flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-lg border-b border-border-subtle">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface m-0">
              Create &amp; Invite User to Platform
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-lg overflow-y-auto flex flex-col gap-xl">
          {/* User Identity Details */}
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h3 className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider text-[11px] text-on-surface-variant">
                User Identity Details
              </h3>
              <span className="bg-success-bg text-success-text px-2 py-0.5 rounded-full font-label-sm text-[10px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check_circle</span> New User Available
              </span>
            </div>
            <div className="flex flex-col gap-sm">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-sm bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. Alice Vance"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-sm">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-sm bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. user@company.com"
                type="email"
              />
            </div>
          </div>

          <div className="h-px bg-border-subtle w-full"></div>

          {/* Workspace & Role Assignment */}
          <div className="flex flex-col gap-md">
            <h3 className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider text-[11px] text-on-surface-variant">
              Workspace &amp; Role Assignment
            </h3>
            <div className="flex gap-md">
              <div className="flex-1 flex flex-col gap-sm relative">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Assign to Workspace</label>
                <div className="relative">
                  <select
                    value={workspace}
                    onChange={(e) => setWorkspace(e.target.value)}
                    className="w-full h-10 pl-sm pr-10 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  >
                    <option>Research &amp; Development</option>
                    <option>Production</option>
                    <option>Staging</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-sm relative">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Assigned Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 pl-sm pr-10 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  >
                    <option>Developer</option>
                    <option>Viewer</option>
                    <option>Admin</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="self-start text-primary font-label-bold text-label-sm hover:underline flex items-center gap-xs mt-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Assign to another workspace
            </button>
          </div>

          <div className="h-px bg-border-subtle w-full"></div>

          {/* Platform Authority */}
          <div className="flex flex-col gap-md">
            <h3 className="font-label-bold text-label-bold text-on-surface uppercase tracking-wider text-[11px] text-on-surface-variant">
              Platform Authority
            </h3>
            <div className="flex items-start gap-sm bg-warning-bg border border-warning-text/20 p-md rounded-lg">
              <input
                checked={isSuperAdmin}
                onChange={(e) => setIsSuperAdmin(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer accent-primary"
                id="superadmin"
                type="checkbox"
              />
              <div className="flex flex-col">
                <label
                  className="font-label-bold text-body-base text-on-surface cursor-pointer flex items-center gap-xs"
                  htmlFor="superadmin"
                >
                  Grant Platform Super Admin Privileges{' '}
                  <span className="material-symbols-outlined text-warning-text text-[16px]">local_police</span>
                </label>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Gives unrestricted wildcard access to platform settings &amp; all teams. Proceed with caution.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-secondary-container/50 text-on-secondary-container p-sm rounded-lg flex items-start gap-sm">
            <span className="material-symbols-outlined text-[18px] mt-0.5 text-secondary">lock</span>
            <p className="font-body-sm text-[12px] leading-relaxed">
              A 24-hour single-use secure link will be generated. The user will set their own secret permanent password upon joining the platform.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-lg border-t border-border-subtle flex items-center justify-end gap-sm bg-surface-container-low rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-md h-10 rounded-lg font-label-bold text-label-sm text-on-surface border border-border-subtle bg-surface-container-lowest hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-md h-10 rounded-lg font-label-bold text-label-sm text-on-primary bg-primary hover:opacity-90 transition-opacity flex items-center gap-xs shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span> Send Invite &amp; Assign
          </button>
        </div>
      </div>
    </div>
  );
}
