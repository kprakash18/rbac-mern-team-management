function OnboardingShell({ children, footer, onClose, team }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md animate-in fade-in duration-150" id="modal-onboard-members">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative bg-card-bg rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-border-subtle z-[1150] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]" onClick={(event) => event.stopPropagation()}>
        <div className="p-lg bg-surface-container-low border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary font-label-bold flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">person_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-on-surface">Onboard Members to {team.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-bold text-[11px]">
                  {team.members?.length || team.membersCount || 0} Current Members
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                Select active platform users to board into this team with designated workspace roles.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}

export default OnboardingShell;
