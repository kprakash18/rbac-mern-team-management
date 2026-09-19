function OnboardingFooter({ onClose, onSubmit, selectedCount, submitting }) {
  return (
    <div className="p-md bg-surface-container-low border-t border-border-subtle flex items-center justify-between shrink-0">
      <div className="text-[12px] text-on-surface-variant">
        {selectedCount > 0 ? (
          <span><strong className="text-primary font-bold">{selectedCount}</strong> active user(s) selected</span>
        ) : (
          <span>Select users above to board into this team</span>
        )}
      </div>

      <div className="flex items-center gap-sm">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-md py-xs bg-surface-container-high text-on-surface font-label-bold text-label-bold rounded-lg shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || selectedCount === 0}
          className={`px-lg py-xs font-label-bold text-label-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedCount > 0 && !submitting
              ? 'bg-primary text-on-primary hover:bg-on-primary-container'
              : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              <span>Boarding...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              <span>Board {selectedCount > 0 ? `${selectedCount} Member(s)` : 'Members'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default OnboardingFooter;
