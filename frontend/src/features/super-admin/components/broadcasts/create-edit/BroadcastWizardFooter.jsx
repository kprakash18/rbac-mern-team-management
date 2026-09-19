function BroadcastWizardFooter({ activeStep, broadcastToEdit, onBack, onCancel, onNext }) {
  return (
    <div className="p-md bg-surface-container-low flex justify-between items-center border-t border-border-subtle shrink-0">
      {activeStep > 1 ? (
        <button
          type="button"
          className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
          onClick={onBack}
        >
          Back
        </button>
      ) : (
        <button
          type="button"
          className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
          onClick={onCancel}
        >
          Cancel
        </button>
      )}

      <div className="flex items-center gap-xs">
        {activeStep < 4 ? (
          <button
            type="button"
            className="h-9 px-lg rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs"
            onClick={onNext}
          >
            Continue &rarr;
          </button>
        ) : (
          <button
            type="submit"
            className="h-9 px-lg rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            <span>{broadcastToEdit ? 'Save Changes' : 'Publish Broadcast'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default BroadcastWizardFooter;
