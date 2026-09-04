import { useState, useEffect } from 'react';
import { WORKSPACE_ROLE_DEFINITIONS } from '@/constants';

export default function ManageMemberRoleModal({ isOpen, member, onClose, onSaveRole }) {
  const [selectedRole, setSelectedRole] = useState(member?.role || 'Developer');
  const [isTeamAdmin, setIsTeamAdmin] = useState(member?.teamRole === 'Team Admin');
  const [department, setDepartment] = useState(member?.department || 'Engineering Core');

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role || 'Developer');
      setIsTeamAdmin(member.teamRole === 'Team Admin');
      setDepartment(member.department || 'Engineering Core');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const currentRoleDef = WORKSPACE_ROLE_DEFINITIONS[selectedRole] || WORKSPACE_ROLE_DEFINITIONS.Developer;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedMember = {
      ...member,
      role: selectedRole,
      teamRole: isTeamAdmin ? 'Team Admin' : selectedRole,
      department,
      permissions: currentRoleDef.permissions,
    };
    onSaveRole(updatedMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-lg pb-md border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Manage Member Role
              </h3>
              <p className="text-body-sm text-[12px] text-on-surface-variant">
                Reassign permissions and administrative authority in this workspace.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-lg flex-1 overflow-y-auto flex flex-col gap-lg">
          {/* Member Info Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-border-subtle">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-label-bold flex items-center justify-center text-label-md shrink-0">
              {member.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-label-bold text-on-surface truncate">{member.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-high text-on-surface-variant">
                  Current: {member.role}
                </span>
              </div>
              <span className="text-body-sm text-[12px] text-on-surface-variant font-mono block truncate">
                {member.email}
              </span>
            </div>
          </div>

          {/* Role Selection Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-bold text-on-surface">
              Target Workspace Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-[13px]"
            >
              {Object.keys(WORKSPACE_ROLE_DEFINITIONS).map((roleName) => (
                <option key={roleName} value={roleName}>
                  {roleName}
                </option>
              ))}
            </select>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              {currentRoleDef.description}
            </p>
          </div>

          {/* Department Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-bold text-on-surface">
              Department / Functional Area
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px]"
              placeholder="e.g., API & Gateway Services"
            />
          </div>

          {/* Team Admin Authority Checkbox */}
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
            <input
              type="checkbox"
              id="team-admin-grant"
              checked={isTeamAdmin}
              onChange={(e) => setIsTeamAdmin(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="team-admin-grant" className="flex flex-col cursor-pointer select-none">
              <span className="font-label-bold text-label-sm text-amber-950 flex items-center gap-1">
                <span>👑 Grant Team Admin Privileges</span>
              </span>
              <span className="text-[11px] text-amber-800 leading-snug mt-0.5">
                Allows member to invite and suspend users, assign roles, approve JIT requests, and view workspace audit logs.
              </span>
            </label>
          </div>

          {/* Granted Permissions Preview */}
          <div className="flex flex-col gap-2">
            <span className="text-label-sm font-label-bold text-on-surface flex items-center justify-between">
              <span>Included Permissions Preview</span>
              <span className="text-[11px] text-on-surface-variant font-normal">
                {currentRoleDef.permissions.length} capabilities
              </span>
            </span>
            <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {currentRoleDef.permissions.map((perm, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-lowest text-on-surface border border-border-subtle text-[11px] font-medium shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">check</span>
                  <span>{perm}</span>
                </span>
              ))}
              {isTeamAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold shadow-2xs">
                  <span className="material-symbols-outlined text-[13px] text-amber-700">crown</span>
                  <span>Full Team Administration</span>
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-lg py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Save Role Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
