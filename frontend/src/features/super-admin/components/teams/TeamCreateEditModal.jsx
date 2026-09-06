export default function TeamCreateEditModal({
  isOpen,
  onClose,
  editingTeam,
  modalTab,
  setModalTab,
  teamForm,
  setTeamForm,
  formSubmitting,
  onSaveTeam,
  availableRoles,
  createSelectedRoles,
  onToggleCreateRole,
  onSelectAllCreateRoles,
  enabledRolesForCreate,
  createMemberSearch,
  setCreateMemberSearch,
  createDefaultRole,
  setCreateDefaultRole,
  createSelectedUsers,
  onSelectAllCreateUsers,
  activePlatformUsers,
  loadingPlatformUsers,
  onToggleCreateUser,
  createRoleOverrides,
  setCreateRoleOverrides,
  onAddMemberRole,
  onInitiateRemoveMemberRole,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-on-primary-fixed/40 backdrop-blur-sm p-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-lg pb-md border-b border-border-subtle bg-surface-container-low shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                {editingTeam ? 'tune' : 'add_business'}
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                {editingTeam ? 'Team Workspace Settings' : 'Create New Team'}
              </h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                {editingTeam
                  ? 'Modify team metadata, lifecycle state, and member role assignments.'
                  : 'Provision a new isolated team workspace and assign domain policies.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-md px-lg pt-sm bg-surface-container-low border-b border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('general')}
            className={`pb-2.5 font-label-bold text-label-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span>{editingTeam ? 'General Settings' : '1. General Details'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('roles')}
            className={`pb-2.5 font-label-bold text-label-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              modalTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>{editingTeam ? 'Team Roles & Members' : '2. Team Roles'}</span>
            {editingTeam && (
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-[11px]">
                {editingTeam.members?.length || 0}
              </span>
            )}
            {!editingTeam && availableRoles.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-[11px]">
                {availableRoles.length}
              </span>
            )}
          </button>

          {!editingTeam && (
            <button
              type="button"
              onClick={() => setModalTab('members')}
              className={`pb-2.5 font-label-bold text-label-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                modalTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>3. Add Members</span>
              {createSelectedUsers.size > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-bold text-[11px]">
                  {createSelectedUsers.size}
                </span>
              )}
            </button>
          )}
        </div>

        {/* TAB: General Details */}
        {modalTab === 'general' && (
          <form onSubmit={(e) => { e.preventDefault(); setModalTab('roles'); }} className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-sm text-on-surface">
                Team Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering Core"
                value={teamForm.name}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-surface border border-border-subtle rounded-lg px-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-sm text-on-surface">Description</label>
              <textarea
                rows={3}
                placeholder="Operational scope and description of this team workspace..."
                value={teamForm.description}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-surface border border-border-subtle rounded-lg p-md font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm resize-none"
              />
            </div>

            {editingTeam && (
              <div className="flex flex-col gap-xs">
                <label className="font-label-bold text-label-sm text-on-surface">Lifecycle Status</label>
                <select
                  value={teamForm.status}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-surface border border-border-subtle rounded-lg px-md py-xs font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between pt-md border-t border-border-subtle mt-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-sm">
                {!editingTeam && (
                  <button
                    type="button"
                    onClick={() => setModalTab('roles')}
                    className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Next: Roles</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onSaveTeam}
                  disabled={formSubmitting || !teamForm.name.trim()}
                  className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingTeam
                    ? 'Save Changes'
                    : createSelectedUsers.size > 0
                    ? `Create Team (${createSelectedUsers.size} Members)`
                    : 'Create Team'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB: Team Roles */}
        {modalTab === 'roles' && (
          editingTeam ? (
            /* Edit Team: Member Roles */
            <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
              <div className="flex items-center justify-between pb-xs border-b border-border-subtle">
                <div>
                  <h3 className="font-label-bold text-label-bold text-on-surface">Workspace Member Roles</h3>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    Assign, reassign, or remove roles for members within this team workspace.
                  </p>
                </div>
              </div>

              <div className="space-y-sm">
                {(!editingTeam.members || editingTeam.members.length === 0) ? (
                  <div className="p-lg text-center text-on-surface-variant">
                    No members assigned to this team yet.
                  </div>
                ) : (
                  editingTeam.members.map((m) => {
                    const initials = m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
                    const memberRoles = m.roles || ['Member'];

                    return (
                      <div
                        key={m.id || m._id || m.email}
                        className="p-md rounded-xl bg-surface-container-low border border-border-subtle/60 flex flex-col gap-xs"
                      >
                        <div className="flex items-center justify-between gap-md">
                          <div className="flex items-center gap-sm min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="truncate">
                              <span className="font-label-bold text-label-sm text-on-surface block truncate">{m.name}</span>
                              <span className="text-[11px] text-on-surface-variant truncate block">{m.email}</span>
                            </div>
                          </div>

                          {/* Role Adder */}
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                onAddMemberRole(editingTeam, m, e.target.value);
                              }
                            }}
                            className="text-[11px] font-label-bold bg-surface-container-highest text-on-surface px-2 py-1 rounded-md border border-border-subtle cursor-pointer outline-none"
                          >
                            <option value="">+ Assign Role</option>
                            {availableRoles
                              .filter((r) => !memberRoles.includes(r.name))
                              .map((r) => (
                                <option key={r.id || r.name} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Member Role Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {memberRoles.map((roleName) => (
                            <span
                              key={roleName}
                              className="px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface text-[11px] font-label-sm flex items-center gap-1 border border-border-subtle shadow-2xs"
                            >
                              <span>{roleName}</span>
                              <button
                                type="button"
                                onClick={() => onInitiateRemoveMemberRole(editingTeam, m, roleName)}
                                className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center text-outline hover:text-error-text cursor-pointer"
                                title={`Remove "${roleName}"`}
                              >
                                <span className="material-symbols-outlined text-[10px]">close</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end pt-md border-t border-border-subtle mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Create Team: Workspace Roles Selection */
            <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
              <div className="p-sm rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
                <p className="text-body-sm text-on-surface text-[12px] leading-relaxed">
                  Select which platform roles to enable for this team workspace. Members onboarded to this team can only be assigned from these enabled roles.
                </p>
              </div>

              {/* Role Selection Toolbar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="font-label-bold text-label-sm text-on-surface uppercase tracking-wider">
                    Configure Team Roles
                  </span>
                  <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {createSelectedRoles.size} of {availableRoles.length} Enabled
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onSelectAllCreateRoles}
                  className="text-[11px] font-label-bold px-2 py-1 rounded-md bg-surface-container-highest text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
                >
                  {createSelectedRoles.size === availableRoles.length && availableRoles.length > 0
                    ? 'Reset Selection'
                    : 'Select All Roles'}
                </button>
              </div>

              {/* Role Selectable Cards */}
              <div className="grid grid-cols-1 gap-xs max-h-[300px] overflow-y-auto pr-1">
                {availableRoles.map((role) => {
                  const roleIdentifier = role.name || role.id;
                  const isRoleSelected = createSelectedRoles.has(roleIdentifier) || createSelectedRoles.has(role.id) || createSelectedRoles.has(role._id);

                  return (
                    <div
                      key={role.id || role._id || role.name}
                      onClick={() => onToggleCreateRole(roleIdentifier)}
                      className={`p-sm rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-sm ${
                        isRoleSelected
                          ? 'bg-primary/5 border-primary shadow-2xs'
                          : 'bg-surface-container-low border-border-subtle/70 hover:border-border-subtle hover:bg-surface-container opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-sm min-w-0">
                        <input
                          type="checkbox"
                          checked={isRoleSelected}
                          onChange={() => onToggleCreateRole(roleIdentifier)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer"
                        />

                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isRoleSelected
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {role.name?.toLowerCase().includes('admin')
                              ? 'shield_person'
                              : role.name?.toLowerCase().includes('lead')
                              ? 'group_work'
                              : 'badge'}
                          </span>
                        </div>

                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-label-bold text-label-sm text-on-surface">
                              {role.name}
                            </span>
                            {role.isSystem && (
                              <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-[10px] text-on-surface-variant font-medium">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant line-clamp-1">
                            {role.description || 'Configured team permission set.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                          {role.permissionCount ?? (role.permissions?.length || 0)} perms
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-label-bold uppercase tracking-wider ${
                            isRoleSelected
                              ? 'bg-success-container/40 text-success'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {isRoleSelected ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-md border-t border-border-subtle mt-auto">
                <button
                  type="button"
                  onClick={() => setModalTab('general')}
                  className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-sm">
                  <button
                    type="button"
                    onClick={() => setModalTab('members')}
                    className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Next: Add Members</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSaveTeam}
                    disabled={formSubmitting || !teamForm.name.trim()}
                    className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Saving...' : 'Create Team'}
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB: Add Members (Create Team Flow) */}
        {modalTab === 'members' && !editingTeam && (
          <div className="p-lg flex flex-col gap-md flex-1 overflow-y-auto">
            {/* Search & Bulk Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-sm bg-surface-container-low p-sm rounded-xl border border-border-subtle">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search active platform users..."
                  value={createMemberSearch}
                  onChange={(e) => setCreateMemberSearch(e.target.value)}
                  className="w-full bg-surface pl-8 pr-3 py-1.5 rounded-lg border border-border-subtle font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-sm shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-on-surface-variant font-label-bold">Default Role:</span>
                  <select
                    value={createDefaultRole}
                    onChange={(e) => setCreateDefaultRole(e.target.value)}
                    className="text-[11px] font-label-bold bg-surface border border-border-subtle rounded-md px-2 py-1 text-on-surface cursor-pointer outline-none"
                  >
                    {enabledRolesForCreate.map((r) => (
                      <option key={r.id || r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={onSelectAllCreateUsers}
                  className="text-[11px] font-label-bold px-2 py-1 rounded-md bg-surface-container-highest text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
                >
                  {createSelectedUsers.size === activePlatformUsers.length && activePlatformUsers.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
            </div>

            {/* Selected Count & Active Indicator */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[12px] font-label-bold text-on-surface">
                Active Users ({activePlatformUsers.length}) · <span className="text-primary font-normal">{enabledRolesForCreate.length} Enabled Team Roles</span>
              </span>
              <span className="text-[11px] font-label-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {createSelectedUsers.size} Selected for Onboarding
              </span>
            </div>

            {/* Active Users List */}
            <div className="space-y-xs max-h-[300px] overflow-y-auto pr-1">
              {loadingPlatformUsers ? (
                <div className="p-xl text-center text-on-surface-variant text-body-sm">
                  Loading active platform users...
                </div>
              ) : activePlatformUsers.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant text-body-sm">
                  No active platform users found to board.
                </div>
              ) : (
                activePlatformUsers
                  .filter((u) => {
                    const q = createMemberSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.email && u.email.toLowerCase().includes(q))
                    );
                  })
                  .map((u) => {
                    const uid = u._id || u.id;
                    const isSelected = createSelectedUsers.has(uid);
                    const initials =
                      u.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'U';
                    const assignedRole = createRoleOverrides[uid] || createDefaultRole;

                    return (
                      <div
                        key={uid}
                        onClick={() => onToggleCreateUser(uid)}
                        className={`p-sm rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-sm ${
                          isSelected
                            ? 'bg-primary/5 border-primary shadow-2xs'
                            : 'bg-surface-container-low border-border-subtle/70 hover:border-border-subtle hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center gap-sm min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleCreateUser(uid)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer"
                          />
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-label-bold text-label-sm text-on-surface block truncate">
                                {u.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-full bg-success-container/40 text-success font-label-bold text-[9px] uppercase tracking-wider">
                                Active
                              </span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant truncate block">
                              {u.email}
                            </span>
                          </div>
                        </div>

                        {/* Assigned Role Selector from Enabled Roles */}
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={assignedRole}
                            onChange={(e) => {
                              setCreateRoleOverrides((prev) => ({
                                ...prev,
                                [uid]: e.target.value,
                              }));
                              if (!isSelected) {
                                onToggleCreateUser(uid);
                              }
                            }}
                            className="text-[11px] font-label-bold bg-surface border border-border-subtle rounded-md px-2 py-1 text-on-surface cursor-pointer outline-none focus:border-primary"
                          >
                            {enabledRolesForCreate.map((r) => (
                              <option key={r.id || r.name} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-md border-t border-border-subtle mt-auto">
              <button
                type="button"
                onClick={() => setModalTab('roles')}
                className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back</span>
              </button>

              <div className="flex items-center gap-sm">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveTeam}
                  disabled={formSubmitting || !teamForm.name.trim()}
                  className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <span>Creating Team...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>
                        {createSelectedUsers.size > 0
                          ? `Create Team & Add ${createSelectedUsers.size} Member(s)`
                          : 'Create Team'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
