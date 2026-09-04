import { useState } from 'react';

const WORKSPACE_ROLE_OPTIONS = [
  'Developer',
  'Lead Architect',
  'Senior Staff SRE',
  'DevOps Engineer',
  'Security Auditor',
  'Senior Backend Developer',
  'Lead UI Engineer',
  'QA Tester',
  'Viewer',
];

const DEPARTMENTS = [
  'Engineering Core',
  'Cloud Infrastructure',
  'Platform Architecture',
  'API & Gateway Services',
  'Design System & Frontend',
  'Reliability & Database Systems',
  'Governance & Compliance',
];

export default function InviteTeamMemberModal({ isOpen, onClose, onInvite }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    onInvite({
      name: name.trim() || 'Invited Teammate',
      email: email.trim(),
      role,
      department,
    });
    setName('');
    setEmail('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-150">
        <div className="p-lg pb-md border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Invite Team Member
              </h3>
              <p className="text-body-sm text-[12px] text-on-surface-variant">
                Send an invitation link to join this workspace.
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

        <form onSubmit={handleSubmit} className="p-lg flex flex-col gap-md">
          {error && (
            <div className="p-2 rounded bg-error-container text-error text-label-sm font-label-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label-bold text-on-surface">Full Name</label>
            <input
              type="text"
              placeholder="e.g., Alex Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label-bold text-on-surface">
              Email Address <span className="text-error">*</span>
            </label>
            <input
              type="email"
              placeholder="alex.miller@acme.corp"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              required
              className="h-10 px-3 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-bold text-on-surface">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 px-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary cursor-pointer"
              >
                {WORKSPACE_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label-bold text-on-surface">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-10 px-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2 pt-md border-t border-border-subtle flex items-center justify-end gap-2">
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
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Send Invitation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
