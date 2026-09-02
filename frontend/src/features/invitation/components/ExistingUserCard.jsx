export default function JoinWorkspaceExistingUserCard({
  invitation,
  onAccept,
  onDecline,
}) {
  const {
    workspaceName = 'Acme Corp',
    role = 'Editor',
    inviterName = 'Sarah Jenkins',
    inviterAvatar = '',
  } = invitation || {};

  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col gap-stack-lg p-section-gap relative">
      <div className="flex flex-col items-center text-center gap-stack-sm relative z-10">
        <div className="w-12 h-12 rounded-full overflow-hidden mb-stack-sm shadow-sm border border-outline-variant/30">
          <img
            src={inviterAvatar}
            alt={inviterName}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Join Workspace
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">
          Welcome back! You’ve been invited to join another team.
        </p>
      </div>

      <div className="bg-surface-container-low rounded-lg p-stack-md flex flex-col gap-stack-sm shadow-sm relative z-10">
        <div className="flex justify-between items-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Workspace
          </span>
          <span className="font-label-md text-label-md text-on-surface font-medium">
            {workspaceName}
          </span>
        </div>
        <div className="h-px w-full bg-outline-variant/30"></div>
        <div className="flex justify-between items-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Invited by
          </span>
          <div className="flex items-center gap-unit">
            <span className="font-label-md text-label-md text-on-surface">
              {inviterName}
            </span>
          </div>
        </div>
        <div className="h-px w-full bg-outline-variant/30"></div>
        <div className="flex justify-between items-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Role
          </span>
          <span className="font-label-md text-label-md text-on-surface font-medium">
            {role}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-stack-md relative z-10">
        <button
          onClick={onAccept}
          className="w-full bg-primary text-on-primary font-label-md text-label-md py-stack-sm px-stack-md rounded-md hover:bg-on-tertiary-fixed transition-colors shadow-sm flex items-center justify-center gap-stack-sm group"
        >
          <span>Accept & join</span>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
        <button
          onClick={onDecline}
          className="w-full bg-transparent text-on-surface font-label-md text-label-md py-stack-sm px-stack-md rounded-md hover:bg-surface-container-low transition-colors flex items-center justify-center"
        >
          Decline invitation
        </button>
      </div>
    </div>
  );
}
