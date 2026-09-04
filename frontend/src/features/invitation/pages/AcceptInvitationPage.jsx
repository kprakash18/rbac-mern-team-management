import { useState } from 'react';
import {
  INVITATION_STATES,
  MOCK_INVITATIONS,
} from '@/constants';
import NewUserCard from '../components/NewUserCard';
import ExistingUserCard from '../components/ExistingUserCard';
import InvalidCard from '../components/InvalidCard';

export default function AcceptInvitationPage() {
  const [viewState, setViewState] = useState(INVITATION_STATES.NEW_USER);

  const handleJoinNewUser = (formData) => {
    console.log('Provisioning new user and joining workspace:', formData);
    alert(`Account created for ${formData.fullName}! Redirecting to workspaces...`);
  };

  const handleAcceptExisting = () => {
    console.log('Existing user accepted invitation');
    alert('Invitation accepted! Redirecting to workspace...');
  };

  const handleDeclineExisting = () => {
    console.log('Existing user declined invitation');
    alert('Invitation declined.');
  };

  const handleGoToLogin = () => {
    console.log('Redirecting to login...');
    alert('Navigating to /login...');
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col">
      {/* Dev Mode State Switcher Toolbar */}
      <div className="bg-surface-container-high px-4 py-2 flex items-center justify-between text-xs border-b border-outline-variant/40 z-50">
        <span className="font-semibold text-on-surface-variant uppercase tracking-wider">
          🛠️ Preview State:
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewState(INVITATION_STATES.NEW_USER)}
            className={`px-3 py-1 rounded transition-colors ${
              viewState === INVITATION_STATES.NEW_USER
                ? 'bg-primary text-on-primary font-medium'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
          >
            1. New User
          </button>
          <button
            type="button"
            onClick={() => setViewState(INVITATION_STATES.EXISTING_USER)}
            className={`px-3 py-1 rounded transition-colors ${
              viewState === INVITATION_STATES.EXISTING_USER
                ? 'bg-primary text-on-primary font-medium'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
          >
            2. Existing User
          </button>
          <button
            type="button"
            onClick={() => setViewState(INVITATION_STATES.INVALID_TOKEN)}
            className={`px-3 py-1 rounded transition-colors ${
              viewState === INVITATION_STATES.INVALID_TOKEN
                ? 'bg-error text-on-error font-medium'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
          >
            3. Invalid Link
          </button>
        </div>
      </div>

      {/* Top Header */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20">
        <div className="h-16 max-w-7xl mx-auto px-container-margin flex items-center justify-between">
          <div className="flex items-center gap-stack-md">
            <img
                alt="Logo"
                className="h-8 w-auto object-contain"
                src="/b2b_saas_logo.png"
            />

            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
              Enterprise SaaS
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-gutter">
            <a
              className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#help"
            >
              Help Center
            </a>
            <a
              className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#privacy"
            >
              Privacy Policy
            </a>
          </nav>
          <div className="flex items-center gap-stack-md">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="flex-1 w-full flex flex-col justify-center items-center py-section-gap px-container-margin">
        {viewState === INVITATION_STATES.NEW_USER && (
          <NewUserCard
            invitation={MOCK_INVITATIONS.newUser}
            onJoin={handleJoinNewUser}
          />
        )}

        {viewState === INVITATION_STATES.EXISTING_USER && (
          <ExistingUserCard
            invitation={MOCK_INVITATIONS.existingUser}
            onAccept={handleAcceptExisting}
            onDecline={handleDeclineExisting}
          />
        )}

        {viewState === INVITATION_STATES.INVALID_TOKEN && (
          <InvalidCard onGoToLogin={handleGoToLogin} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-stack-lg border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-container-margin flex flex-col md:flex-row justify-between items-center gap-stack-md text-on-surface-variant font-label-sm text-label-sm">
          <span>© 2024 Enterprise SaaS. All rights reserved.</span>
          <div className="flex gap-gutter">
            <a className="hover:text-on-surface" href="#terms">
              Terms
            </a>
            <a className="hover:text-on-surface" href="#support">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
