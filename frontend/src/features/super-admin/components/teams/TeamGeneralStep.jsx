export default function TeamGeneralStep({
  teamForm,
  editingTeam,
  selectedMemberCount,
  formSubmitting,
  onFormChange,
  onCancel,
  onNext,
  onSave,
}) {
  const canSave = Boolean(teamForm.name.trim());

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      className="p-lg flex flex-col gap-md flex-1 overflow-y-auto"
    >
      <div className="flex flex-col gap-xs">
        <label className="font-label-bold text-label-sm text-on-surface">
          Team Name <span className="text-error">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Engineering Core"
          value={teamForm.name}
          onChange={(event) => onFormChange({ name: event.target.value })}
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
          onChange={(event) => onFormChange({ description: event.target.value })}
          className="w-full bg-surface border border-border-subtle rounded-lg p-md font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm resize-none"
        />
      </div>

      {editingTeam && (
        <div className="flex flex-col gap-xs">
          <label className="font-label-bold text-label-sm text-on-surface">Lifecycle Status</label>
          <select
            value={teamForm.status}
            onChange={(event) => onFormChange({ status: event.target.value })}
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
          onClick={onCancel}
          className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center gap-sm">
          {!editingTeam && (
            <button
              type="button"
              onClick={onNext}
              className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next: Roles</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={formSubmitting || !canSave}
            className="px-md py-xs bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-on-primary-container transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {formSubmitting
              ? 'Saving...'
              : editingTeam
              ? 'Save Changes'
              : selectedMemberCount > 0
              ? `Create Team (${selectedMemberCount} Members)`
              : 'Create Team'}
          </button>
        </div>
      </div>
    </form>
  );
}
