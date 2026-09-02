export default function InvalidInvitationCard({ onGoToLogin }) {
  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg relative z-10">
      {/* Header Illustration */}
      <div className="w-full h-32 bg-surface-container flex items-center justify-center rounded-t-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-error-container/50 to-surface-container"></div>
        <div className="relative w-16 h-16 bg-surface-container-lowest rounded-full shadow-sm flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-[32px]">
            link_off
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-stack-lg flex flex-col items-center text-center gap-stack-md">
        <div className="flex flex-col gap-unit">
          <h1 className="font-headline-sm text-headline-sm text-on-surface">
            This invitation link is no longer valid
          </h1>
        </div>

        {/* Message Block */}
        <div className="w-full bg-surface-container-low rounded-lg p-stack-md text-left flex items-start gap-stack-sm shadow-inner">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px] mt-[2px]">
            info
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant flex-1">
            If you were expecting to join a workspace, please ask your
            administrator to send you a new invitation.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-stack-md mt-stack-sm">
          <button
            onClick={onGoToLogin}
            className="w-full py-3 px-6 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/90 hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Go to login
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
          <button
            type="button"
            className="w-full text-center font-label-md text-label-md text-primary hover:text-primary/70 underline underline-offset-4 decoration-primary/30 transition-colors"
          >
            Contact your administrator
          </button>
        </div>
      </div>
    </div>
  );
}
