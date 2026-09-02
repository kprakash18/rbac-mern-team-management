import { useState } from 'react';

export default function InviteSuccessModal({ isOpen, inviteData, onClose, onInviteAnother }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !inviteData) return null;

  const {
    fullName = 'Alice Vance',
    email = 'alice@company.com',
    workspace = 'Research & Development',
    role = 'Developer',
    inviteLink = 'https://app.company.com/invite/tok_8f92a4b1c3d5e7',
  } = inviteData;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col w-full h-full items-center justify-center p-md bg-inverse-surface/40 backdrop-blur-sm fixed inset-0 z-50">
      <div className="w-full max-w-[580px] bg-card-bg shadow-xl flex flex-col rounded-xl overflow-hidden animate-[fade-in_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-border-subtle bg-success-bg/20">
          <div className="flex items-center gap-sm text-success-text">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">User Invited Successfully!</h2>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-container rounded-full p-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-lg flex flex-col gap-lg">
          <p className="font-body-base text-body-base text-on-surface-variant">
            An invitation email was dispatched to <span className="font-label-bold text-on-surface">{email}</span>.
          </p>

          {/* Direct Link Sharing */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Or share this link directly via Slack / Teams / Chat:
            </label>
            <div className="flex items-center gap-xs">
              <input
                className="flex-1 bg-surface-container-low border border-border-subtle rounded-lg px-md py-sm font-body-base text-body-base text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary truncate font-mono text-[13px]"
                readOnly
                type="text"
                value={inviteLink}
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-xs px-md py-sm rounded-lg font-label-bold text-label-sm transition-colors whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'text-success-text bg-success-bg/30'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface active:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-surface-container-low rounded-lg p-md flex flex-col gap-sm border border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div className="flex flex-col">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">Name</span>
                <span className="font-label-bold text-body-sm text-on-surface">{fullName}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">Initial Team</span>
                <span className="font-label-bold text-body-sm text-on-surface">{workspace}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">Assigned Role</span>
                <div className="flex items-center gap-xs mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-label-bold text-body-sm text-on-surface">{role}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">Link Expiration</span>
                <span className="font-body-sm text-body-sm text-on-surface">In 24 hours (Single-use token)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-lowest flex justify-end gap-sm items-center">
          <button
            onClick={onInviteAnother}
            className="px-lg py-[10px] rounded-lg border border-border-subtle bg-surface-container-lowest hover:bg-surface-container-low font-label-bold text-label-sm text-on-surface transition-colors cursor-pointer"
          >
            Invite Another User
          </button>
          <button
            onClick={onClose}
            className="px-lg py-[10px] rounded-lg bg-primary hover:opacity-90 font-label-bold text-label-sm text-on-primary transition-opacity shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
