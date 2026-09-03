import { useState } from 'react';
import AuthHeader from '../components/AuthHeader';
import AuthErrorBanner from '../components/AuthErrorBanner';
import LoginForm from '../components/LoginForm';
import { USE_MOCK_DATA, MOCK_USERS } from '../constants/auth.constants';

export default function LoginPage({ onLoginSuccess }) {
  const [error, setError] = useState('');
  const [prefilledCredentials, setPrefilledCredentials] = useState(null);

  const handleLogin = ({ email, password, rememberMe }) => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (USE_MOCK_DATA) {
      const normalizedEmail = email.trim().toLowerCase();
      const matchedUser = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
      );

      if (!matchedUser) {
        setError('Invalid email or password. Click the demo account below to fill.');
        return;
      }

      if (matchedUser.accountStatus === 'SUSPENDED') {
        setError('Your account is currently suspended. Please contact your administrator.');
        return;
      }

      if (matchedUser.mustChangePassword) {
        setError('Password reset required for invited accounts.');
        return;
      }

      // Always overwrite the stored session so switching accounts works correctly.
      // If rememberMe is unchecked we still save the session for this browser session;
      // the user must explicitly log out to clear it.
      localStorage.setItem('auth_session', JSON.stringify(matchedUser));

      if (onLoginSuccess) {
        onLoginSuccess(matchedUser);
      }
    }
  };

  const handleQuickFill = (user) => {
    setPrefilledCredentials({
      email: user.email,
      password: user.password,
    });
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface font-body-base text-on-surface antialiased p-md">
      <main className="w-[440px] max-w-[94vw] mx-auto">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-lg border border-surface-variant p-lg sm:p-xl flex flex-col gap-md">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-xs">
            <AuthHeader
              title="Platform Control Plane"
              subtitle="Sign in with your Super Admin credentials to access governance, RBAC & security."
            />
          </div>

          {/* Error Banner */}
          <AuthErrorBanner message={error} />

          {/* Form */}
          <LoginForm
            onSubmit={handleLogin}
            initialValues={prefilledCredentials}
            onInputChange={() => {
              if (error) setError('');
            }}
          />

          {/* Quick-Fill Demo Credentials Helper */}
          <div className="mt-xs pt-md border-t border-border-subtle flex flex-col gap-xs text-[12px]">
            <span className="text-on-surface-variant font-label-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">key</span>
              <span>Demo Accounts (Click to Auto-Fill):</span>
            </span>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-0.5">Super Admin</p>
              <button
                type="button"
                onClick={() => handleQuickFill(MOCK_USERS[0])}
                className="w-full p-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-left flex items-center justify-between transition-colors cursor-pointer border border-primary/20 group"
              >
                <div>
                  <span className="font-bold text-on-surface block text-[12px]">Alex Vance — Platform Super Admin</span>
                  <span className="text-on-surface-variant text-[11px] font-mono">admin@platform.internal / password123</span>
                </div>
                <span className="text-[11px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Fill →</span>
              </button>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-0.5 mt-sm">Team Employee</p>
              <button
                type="button"
                onClick={() => handleQuickFill(MOCK_USERS[2])}
                className="w-full p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors cursor-pointer border border-border-subtle group"
              >
                <div>
                  <span className="font-bold text-on-surface block text-[12px]">Alice Johnson — Lead Architect</span>
                  <span className="text-on-surface-variant text-[11px] font-mono">alice.j@example.com / alice123</span>
                </div>
                <span className="text-[11px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Fill →</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
