import { useState } from 'react';
import { CANONICAL_PERMISSIONS } from '@/constants';

export default function RoleMembersDrawer({
  isOpen,
  role,
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
  const [assignFormData, setAssignFormData] = useState({
    name: '',
    email: '',
    workspace: 'Engineering Core',
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
      workspace: 'Engineering Core',
      ttlType: 'Permanent',
      customTtlValue: 7,
      customTtlUnit: 'days',
    });
    setIsAssignFormOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      {/* Slide-over panel pinned directly to right edge of browser */}
      <div
        className="fixed top-0 bottom-0 right-0 w-full sm:w-[500px] bg-card-bg shadow-2xl flex flex-col justify-between border-l border-border-subtle z-[1000] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-lg bg-surface-container-lowest border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-sm">
            <div
              className={`w-10 h-10 rounded-lg ${role.iconBg || 'bg-surface-container'} flex items-center justify-center text-on-surface shrink-0`}
            >
              <span className="material-symbols-outlined text-[22px]">{role.icon || 'shield_person'}</span>
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <h3 className="font-headline-md text-headline-md text-on-surface">{role.name}</h3>
                {role.type === 'system' ? (
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-[10px] font-semibold">
                    SYSTEM PRESET
                  </span>
                ) : role.status === 'disabled' ? (
                  <span className="px-1.5 py-0.5 rounded bg-warning-bg text-warning-text font-label-sm text-[10px] font-semibold border border-warning-text/30">
                    DISABLED
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-[10px] font-semibold">
                    CUSTOM ROLE
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                {role.desc || `${role.members} active user assignments`}
              </p>
            </div>
          </div>
          <button
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Tab Navigation */}
        <div className="flex border-b border-border-subtle bg-surface-container-lowest px-lg pt-sm gap-md shrink-0">
          <button
            type="button"
            className={`pb-2.5 text-label-sm font-label-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('members')}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Assigned Users ({role.assignedUsers?.length || role.members})</span>
          </button>
          <button
            type="button"
            className={`pb-2.5 text-label-sm font-label-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('permissions')}
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            <span>Permissions ({role.permissionKeys?.length || role.perms})</span>
          </button>
        </div>

        {/* Drawer Body - Tab 1: Assigned Members */}
        {activeTab === 'members' ? (
          <div className="p-lg flex-1 overflow-y-auto space-y-md">
            {/* Controls: Search & Add Member button */}
            <div className="flex items-center gap-sm">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[18px]">search</span>
                <input
                  className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Filter users by name, email, workspace..."
                  type="text"
                />
              </div>
              <button
                type="button"
                className={`h-9 px-md rounded-lg font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  isAssignFormOpen
                    ? 'bg-surface-container-high text-on-surface'
                    : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
                onClick={() => setIsAssignFormOpen(!isAssignFormOpen)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isAssignFormOpen ? 'remove' : 'person_add'}
                </span>
                <span>{isAssignFormOpen ? 'Close' : 'Assign'}</span>
              </button>
            </div>

            {/* Inline Assign Member Form */}
            {isAssignFormOpen && (
              <form
                onSubmit={handleFormSubmit}
                className="p-md bg-surface-container-low rounded-xl border border-border-subtle space-y-sm animate-in fade-in-50 duration-150"
              >
                <div className="flex items-center justify-between pb-xs border-b border-border-subtle">
                  <span className="font-label-bold text-label-sm text-on-surface">
                    Assign New User to {role.name}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium">Step 1 of 1</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  <div>
                    <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={assignFormData.name}
                      onChange={(e) => setAssignFormData({ ...assignFormData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full h-8 px-sm bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={assignFormData.email}
                      onChange={(e) => setAssignFormData({ ...assignFormData, email: e.target.value })}
                      placeholder="alex.m@company.com"
                      className="w-full h-8 px-sm bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  <div>
                    <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                      Workspace Scope
                    </label>
                    <select
                      value={assignFormData.workspace}
                      onChange={(e) => setAssignFormData({ ...assignFormData, workspace: e.target.value })}
                      className="w-full h-8 px-xs bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none cursor-pointer"
                    >
                      <option value="Engineering Core">Engineering Core</option>
                      <option value="Finance Secure">Finance Secure</option>
                      <option value="Marketing Global">Marketing Global</option>
                      <option value="Research & Dev">Research & Dev</option>
                      <option value="Global Platform">Global Platform</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-label-bold text-on-surface-variant block mb-0.5">
                      TTL Policy
                    </label>
                    <select
                      value={assignFormData.ttlType}
                      onChange={(e) => setAssignFormData({ ...assignFormData, ttlType: e.target.value })}
                      className="w-full h-8 px-xs bg-surface-container-lowest rounded-md text-[12px] border border-border-subtle focus:outline-none cursor-pointer"
                    >
                      <option value="Permanent">Permanent (No Expiry)</option>
                      <option value="14d">14 Days (Sprint Grant)</option>
                      <option value="30d">30 Days (Monthly Access)</option>
                      <option value="90d">90 Days (Quarterly Audit)</option>
                      <option value="custom">Custom Duration...</option>
                    </select>
                  </div>
                </div>

                {/* Custom TTL Inputs if "custom" is selected */}
                {assignFormData.ttlType === 'custom' && (
                  <div className="p-xs bg-surface-container-lowest rounded-lg border border-border-subtle space-y-xs animate-in fade-in-50 duration-150">
                    <label className="text-[11px] font-label-bold text-primary block">
                      Configure Custom Duration
                    </label>
                    <div className="flex items-center gap-xs">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={assignFormData.customTtlValue}
                          onChange={(e) =>
                            setAssignFormData({
                              ...assignFormData,
                              customTtlValue: e.target.value === '' ? '' : parseInt(e.target.value, 10) || '',
                            })
                          }
                          className="w-full h-8 px-sm bg-surface-container-low rounded text-[12px] border border-border-subtle focus:outline-none font-bold"
                          placeholder="e.g. 45"
                          required
                        />
                      </div>
                      <div className="w-28">
                        <select
                          value={assignFormData.customTtlUnit}
                          onChange={(e) => setAssignFormData({ ...assignFormData, customTtlUnit: e.target.value })}
                          className="w-full h-8 px-xs bg-surface-container-low rounded text-[12px] border border-border-subtle focus:outline-none cursor-pointer"
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-primary">info</span>
                      <span>
                        Grant will expire in <strong>{assignFormData.customTtlValue || '...'} {assignFormData.customTtlUnit}</strong> from assignment date.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-xs">
                  <button
                    type="submit"
                    className="h-8 px-md rounded-md bg-primary text-on-primary font-label-bold text-[12px] cursor-pointer hover:bg-primary-container transition-colors"
                  >
                    Confirm Assignment
                  </button>
                </div>
              </form>
            )}

            {/* User Roster List */}
            <div className="space-y-xs">
              {drawerFilteredUsers.length === 0 ? (
                <div className="py-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px] text-outline mb-xs">group_off</span>
                  <p className="text-body-sm text-on-surface font-semibold">No matching users</p>
                  <p className="text-[12px] text-on-surface-variant">Click "+ Assign" above to assign users to this role.</p>
                </div>
              ) : (
                <>
                  {drawerFilteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-md rounded-xl bg-surface-container-low flex items-center justify-between gap-sm hover:bg-surface-container transition-colors border border-border-subtle/40"
                    >
                      <div className="flex items-center gap-sm">
                        <div
                          className={`w-9 h-9 rounded-full ${user.bg || 'bg-primary text-on-primary'} flex items-center justify-center font-label-bold text-[12px] shrink-0`}
                        >
                          {user.initials || 'U'}
                        </div>
                        <div>
                          <div className="font-label-bold text-label-sm text-on-surface">{user.name}</div>
                          <div className="font-body-sm text-[12px] text-on-surface-variant">{user.email}</div>
                          <div className="flex items-center gap-xs mt-1 flex-wrap">
                            {/* Interactive Workspace Badge */}
                            <button
                              type="button"
                              onClick={() => onOpenEditWorkspace(user)}
                              className="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-[10px] font-medium flex items-center gap-0.5 cursor-pointer transition-colors"
                              title="Click to change workspace scope"
                            >
                              <span>{user.workspace || 'Default'}</span>
                              <span className="material-symbols-outlined text-[11px] text-outline">edit</span>
                            </button>
                            <span className="text-outline text-[10px]">•</span>
                            {/* Interactive TTL Expiration Badge */}
                            <button
                              type="button"
                              onClick={() => onOpenEditTtl(user)}
                              className="text-[10px] text-on-surface-variant hover:text-primary flex items-center gap-0.5 cursor-pointer px-1 py-0.5 rounded hover:bg-surface-container-high transition-colors"
                              title="Click to update TTL expiration"
                            >
                              <span className="material-symbols-outlined text-[12px] text-primary">schedule</span>
                              <span>{user.ttl || 'Permanent'}</span>
                              <span className="material-symbols-outlined text-[11px] text-outline">edit</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Member Quick Action Controls */}
                      <div className="flex items-center gap-xs shrink-0">
                        <button
                          className="h-8 px-xs rounded-lg hover:bg-surface-container text-on-surface font-label-sm text-[12px] flex items-center gap-1 transition-colors cursor-pointer border border-border-subtle"
                          title="Reassign to another role"
                          onClick={() => onOpenReassignUser(user)}
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">swap_horiz</span>
                          <span>Reassign</span>
                        </button>
                        <button
                          className="h-8 px-xs rounded-lg hover:bg-error-bg text-error-text font-label-sm text-[12px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="Revoke / Unassign role"
                          onClick={() => onUnassignUser(user.id)}
                        >
                          <span className="material-symbols-outlined text-[16px]">person_remove</span>
                          <span>Revoke</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Developer batch overflow notice */}
                  {role.id === 'dev' && (
                    <div className="p-sm bg-surface-container-lowest rounded-lg border border-dashed border-border-subtle text-center text-[12px] text-on-surface-variant">
                      + 102 additional workspace developers holding active scoped tokens.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Drawer Body - Tab 2: Permissions Matrix */
          <div className="p-lg flex-1 overflow-y-auto space-y-md">
            <div className="bg-surface-container-low p-md rounded-lg flex items-center justify-between">
              <div>
                <span className="font-label-sm text-body-sm text-on-surface-variant block">Access Scope Level</span>
                <span className="text-[12px] text-on-surface-variant">
                  {role.permissionKeys?.length || role.perms} permissions attached
                </span>
              </div>
              <span
                className={
                  role.scopeType === 'wildcard'
                    ? 'px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-[11px]'
                    : 'px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-[11px]'
                }
              >
                {role.scopeBadge || 'Scoped'}
              </span>
            </div>

            {role.type === 'system' && (
              <div className="p-sm bg-surface-container-low rounded-lg flex items-center gap-sm text-[12px] text-on-surface-variant border border-border-subtle">
                <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
                <span>System preset permissions are immutable to guarantee baseline platform integrity.</span>
              </div>
            )}

            <div>
              <h4 className="font-label-bold text-label-bold text-on-surface mb-xs">Granular Permission Keys</h4>
              <div className="space-y-xs">
                {CANONICAL_PERMISSIONS.map((perm) => {
                  const isGranted =
                    role.scopeType === 'wildcard' ||
                    (role.permissionKeys || []).includes(perm.key);
                  const isEditable = role.type === 'custom';

                  return (
                    <div
                      key={perm.key}
                      className={`p-sm rounded-lg flex items-center justify-between shadow-xs border border-border-subtle/40 transition-colors ${
                        isGranted ? 'bg-surface-container-lowest' : 'bg-surface-container-low/40 opacity-60'
                      }`}
                    >
                      <div className="pr-sm">
                        <span className="font-mono font-bold text-label-sm text-on-surface block text-[12px]">
                          {perm.key}
                        </span>
                        <span className="font-body-sm text-[12px] text-on-surface-variant">{perm.desc}</span>
                      </div>
                      {isEditable ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={() => onToggleInspectorPermission(perm.key)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      ) : isGranted ? (
                        <span className="material-symbols-outlined text-success-text text-[18px]">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-outline text-[18px]">cancel</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Drawer Footer */}
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
