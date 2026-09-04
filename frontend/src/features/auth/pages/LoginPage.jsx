import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import { USE_MOCK_DATA, MOCK_USERS } from '@/constants';

function AuthHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center mb-5">
      <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-stack-md">
        <img
          alt="Company Logo"
          className="w-8 h-8 object-contain mix-blend-multiply"
          src="/b2b_saas_logo.png"
        />
      </div>
      <h1 className="text-[22px] font-semibold text-on-surface mb-stack-sm leading-tight tracking-tight">
        {title}
      </h1>
      <p className="font-body-md text-on-surface-variant">{subtitle}</p>
    </div>
  );
}

function AuthErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-error-container/30 border border-error-container rounded-md p-stack-sm mb-5 flex items-center gap-stack-sm text-error animate-in fade-in">
      <span className="material-symbols-outlined text-[18px]">error</span>
      <span className="font-label-md">{message}</span>
    </div>
  );
}

export default function LoginPage({ onLoginSuccess }) {
  const [error, setError] = useState('');
  const [prefilledCredentials, setPrefilledCredentials] = useState(null);

  const handleLogin = ({ email, password }) => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (USE_MOCK_DATA) {
      const normalizedEmail = email.trim().toLowerCase();
      let platformUsers = [];
      try {
        const stored = localStorage.getItem('platform_users_list');
        if (stored) platformUsers = JSON.parse(stored);
      } catch {}

      const allUsers = [...MOCK_USERS];
      platformUsers.forEach((pu) => {
        const idx = allUsers.findIndex((u) => u.email.toLowerCase() === pu.email.toLowerCase());
        if (idx >= 0) {
          allUsers[idx] = {
            ...allUsers[idx],
            ...pu,
            mustChangePassword: pu.mustChangePassword !== undefined ? pu.mustChangePassword : allUsers[idx].mustChangePassword,
          };
        } else {
          allUsers.push({
            id: pu.id,
            email: pu.email,
            password: pu.password || 'password123',
            name: pu.name,
            role: pu.workspaces?.[0]?.role || 'Developer',
            teamRoleTitle: pu.workspaces?.[0]?.role || 'Developer',
            isTeamAdmin: Boolean(pu.isTeamAdmin),
            initials: pu.initials || 'U',
            accountStatus: (pu.status || 'Active').toUpperCase(),
            mustChangePassword: Boolean(pu.mustChangePassword),
          });
        }
      });

      const matchedUser = allUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail && (u.password === password || (!u.password && password === 'password123'))
      );

      if (!matchedUser) {
        setError('Invalid email or password. Click the demo account below to fill.');
        return;
      }

      if (matchedUser.accountStatus === 'SUSPENDED') {
        setError('Your account is currently suspended. Please contact your administrator.');
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
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest pl-0.5 mt-sm flex items-center gap-1">
                <span>👑 Team Admin</span>
              </p>
              <button
                type="button"
                onClick={() => handleQuickFill(MOCK_USERS.find((u) => u.email === 'diana.m@acme.corp'))}
                className="w-full p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100/70 text-left flex items-center justify-between transition-colors cursor-pointer border border-amber-300 group"
              >
                <div>
                  <span className="font-bold text-on-surface block text-[12px]">Diana Morales — Lead Architect (Team Admin)</span>
                  <span className="text-on-surface-variant text-[11px] font-mono">diana.m@acme.corp / password123</span>
                </div>
                <span className="text-[11px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Fill →</span>
              </button>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-0.5 mt-sm">Normal Team Member</p>
              <button
                type="button"
                onClick={() => handleQuickFill(MOCK_USERS.find((u) => u.email === 'marcus.v@acme.corp'))}
                className="w-full p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors cursor-pointer border border-border-subtle group"
              >
                <div>
                  <span className="font-bold text-on-surface block text-[12px]">Marcus Vance — Developer</span>
                  <span className="text-on-surface-variant text-[11px] font-mono">marcus.v@acme.corp / password123</span>
                </div>
                <span className="text-[11px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Fill →</span>
              </button>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-0.5 mt-xs">Forced Password Change (Admin Required)</p>
              <button
                type="button"
                onClick={() => handleQuickFill(MOCK_USERS.find((u) => u.email === 'invited@example.com'))}
                className="w-full p-2.5 rounded-lg bg-warning-bg/40 hover:bg-warning-bg/70 text-left flex items-center justify-between transition-colors cursor-pointer border border-warning-text/30 group"
              >
                <div>
                  <span className="font-bold text-on-surface block text-[12px]">Invited User — Temporary Password</span>
                  <span className="text-on-surface-variant text-[11px] font-mono">invited@example.com / temp123Password!</span>
                </div>
                <span className="text-[11px] text-warning-text font-bold opacity-0 group-hover:opacity-100 transition-opacity">Fill →</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
