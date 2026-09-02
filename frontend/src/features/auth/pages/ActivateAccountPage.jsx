import { useState } from 'react';
import ActivationHeader from '../components/ActivationHeader';
import ActivationForm from '../components/ActivationForm';
import AuthErrorBanner from '../components/AuthErrorBanner';
import { USE_MOCK_DATA, MOCK_USERS } from '../constants/auth.constants';

export default function ActivateAccountPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleActivatePassword = ({ newPassword, confirmPassword }) => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (USE_MOCK_DATA) {
      // Find mock invited user
      const invitedUser = MOCK_USERS.find((u) => u.email === 'invited@example.com');
      if (invitedUser && newPassword === invitedUser.password) {
        setError('New password must be different from your temporary password.');
        return;
      }

      // Update mock status
      if (invitedUser) {
        invitedUser.mustChangePassword = false;
        invitedUser.accountStatus = 'ACTIVE';
        invitedUser.password = newPassword;
      }

      setSuccess(true);
      console.log('Account activated successfully! Redirecting to /workspaces...');
    }
  };

  return (
    <div
      className="font-body-md text-on-background min-h-screen flex flex-col bg-surface"
      style={{ backgroundColor: 'rgb(248, 250, 252)' }}
    >
      {/* Top Header */}
      <header className="w-full py-container-margin flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-stack-sm">
          <img
            alt="ACME Logo"
            className="h-10 w-auto object-contain"
            src="/b2b_saas_logo.png"
          />
          <span className="font-headline-sm text-headline-sm text-primary uppercase tracking-widest">
            Acme Corp
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[640px] mx-auto px-container-margin pb-section-gap">
        <div className="flex flex-col w-full items-center justify-center">
          <div
            className="w-full max-w-[440px] bg-surface-container-lowest rounded-lg shadow-sm border border-surface-container-highest p-container-margin"
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              border: '1px solid rgb(226, 232, 240)',
              boxShadow:
                'rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px',
            }}
          >
            {/* Header Section */}
            <ActivationHeader />

            {/* Error Feedback */}
            <AuthErrorBanner message={error} />

            {/* Form Section */}
            <ActivationForm
              onSubmit={handleActivatePassword}
              onInputChange={() => {
                if (error) setError('');
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-stack-lg text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Secure Enterprise SaaS Environment • © 2024 Acme Corp
        </p>
      </footer>
    </div>
  );
}
