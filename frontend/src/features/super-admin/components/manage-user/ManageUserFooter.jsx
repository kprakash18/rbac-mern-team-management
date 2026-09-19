function ManageUserFooter({ onClose, onSave }) {
  return (
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
        onClick={onSave}
        className="px-lg py-sm bg-primary hover:bg-surface-tint text-on-primary font-label-bold rounded-lg shadow-sm transition-colors cursor-pointer"
      >
        Save Changes
      </button>
    </div>
  );
}

export default ManageUserFooter;
