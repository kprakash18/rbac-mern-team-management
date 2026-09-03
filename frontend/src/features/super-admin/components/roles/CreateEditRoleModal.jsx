import {
  CANONICAL_PERMISSIONS,
  CATEGORY_LABELS,
  permissionsByCategory,
} from '../../constants/roles.constants.js';

export default function CreateEditRoleModal({
  isOpen,
  form,
  roles,
  onClose,
  onChangeForm,
  onTemplateChange,
  onToggleCategory,
  onToggleSinglePermission,
  onSave,
  onInitiateDelete,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-create-role">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_moderator</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {form.id ? 'Edit Custom Role' : 'Create Custom Role'}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Define bespoke scopes and member assignments across 35 granular permissions
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

        <form onSubmit={onSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-lg overflow-y-auto space-y-md flex-1">
            <div>
              <label className="block font-label-bold text-label-sm text-on-surface mb-1">Role Name</label>
              <input
                className="w-full h-10 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-inner"
                value={form.name}
                onChange={(e) => onChangeForm({ ...form, name: e.target.value })}
                placeholder="e.g., Regional Compliance Reviewer"
                required
                type="text"
              />
            </div>
            <div>
              <label className="block font-label-bold text-label-sm text-on-surface mb-1">Description</label>
              <textarea
                className="w-full p-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-inner"
                value={form.description}
                onChange={(e) => onChangeForm({ ...form, description: e.target.value })}
                placeholder="Describe the responsibilities and scope boundary of this role..."
                rows="2"
              ></textarea>
            </div>
            <div>
              <label className="block font-label-bold text-label-sm text-on-surface mb-xs">
                Base Template (Optional)
              </label>
              <select
                className="w-full h-10 px-sm bg-surface-container-low rounded-lg text-body-sm text-on-surface focus:outline-none cursor-pointer"
                value={form.template}
                onChange={(e) => onTemplateChange(e.target.value)}
              >
                <option value="none">Start with custom permission set</option>
                <option value="developer">Clone from Team Member / Developer (9 permissions)</option>
                <option value="ws-admin">Clone from Workspace Admin (13 permissions)</option>
                <option value="auditor">Clone from Read-Only Auditor (6 permissions)</option>
              </select>
            </div>

            {/* Permissions Matrix Header */}
            <div className="pt-sm">
              <div className="flex items-center justify-between pb-xs">
                <label className="font-label-bold text-label-bold text-on-surface">
                  Permission Grants ({form.selectedPermissions.size} of {CANONICAL_PERMISSIONS.length} selected)
                </label>
                <div className="flex items-center gap-xs">
                  <button
                    type="button"
                    className="text-[12px] font-label-bold text-primary hover:underline cursor-pointer"
                    onClick={() =>
                      onChangeForm({
                        ...form,
                        selectedPermissions: new Set(CANONICAL_PERMISSIONS.map((p) => p.key)),
                      })
                    }
                  >
                    Select All
                  </button>
                  <span className="text-outline text-[12px]">•</span>
                  <button
                    type="button"
                    className="text-[12px] font-label-bold text-error-text hover:underline cursor-pointer"
                    onClick={() => onChangeForm({ ...form, selectedPermissions: new Set() })}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Search Permissions */}
              <div className="relative mb-sm">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter permissions by key or action..."
                  value={form.searchPermQuery}
                  onChange={(e) => onChangeForm({ ...form, searchPermQuery: e.target.value })}
                  className="w-full h-8 pl-8 pr-3 bg-surface-container-low rounded-md text-[12px] text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                />
              </div>

              {/* Category Matrix */}
              <div className="space-y-md">
                {Object.entries(permissionsByCategory).map(([categoryKey, perms]) => {
                  const filteredPerms = perms.filter((p) => {
                    const q = (form.searchPermQuery || '').toLowerCase().trim();
                    return !q || (p.key || '').toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q);
                  });

                  if (filteredPerms.length === 0) return null;

                  const allSelected = filteredPerms.every((p) => form.selectedPermissions.has(p.key));

                  return (
                    <div
                      key={categoryKey}
                      className="bg-surface-container-low rounded-xl p-sm border border-border-subtle/50"
                    >
                      <div className="flex items-center justify-between pb-xs mb-xs border-b border-border-subtle/40">
                        <span className="font-label-bold text-label-sm text-on-surface">
                          {CATEGORY_LABELS[categoryKey]}
                        </span>
                        <button
                          type="button"
                          className="text-[11px] font-label-bold text-primary hover:underline cursor-pointer"
                          onClick={() => onToggleCategory(categoryKey, !allSelected)}
                        >
                          {allSelected ? 'Deselect Category' : 'Select All in Category'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
                        {filteredPerms.map((perm) => {
                          const isChecked = form.selectedPermissions.has(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-start gap-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                                isChecked ? 'bg-surface-container-lowest shadow-xs' : 'hover:bg-surface-container'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => onToggleSinglePermission(perm.key)}
                                className="rounded w-4 h-4 text-primary focus:ring-0 cursor-pointer mt-0.5"
                              />
                              <div className="flex flex-col">
                                <span className="font-mono text-[11px] font-bold text-on-surface">{perm.key}</span>
                                <span className="text-[11px] text-on-surface-variant leading-tight">{perm.desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-md bg-surface-container-low flex items-center justify-between gap-xs border-t border-border-subtle shrink-0">
            <div>
              {form.id && (
                <button
                  type="button"
                  className="h-9 px-sm rounded-lg hover:bg-error-bg text-error-text font-label-bold text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
                  onClick={() => {
                    const existing = roles.find((r) => r.id === form.id);
                    if (existing) {
                      onClose();
                      onInitiateDelete(existing);
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Delete Role</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-xs">
              <button
                type="button"
                className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-md rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-bold text-label-sm transition-colors cursor-pointer"
              >
                Save &amp; Deploy Role
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
