import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import api from '@/lib/api';

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
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ email, password }) => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // ─── Live API Mode ──────────────────────────────────
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });

      const responsePayload = response.data?.data;
      if (responsePayload) {
        const isUserSuperAdmin = Boolean(
          responsePayload.user.isSuperAdmin ||
          responsePayload.user.role === 'Platform Super Admin' ||
          responsePayload.user.roles?.includes('Super Admin') ||
          responsePayload.user.roles?.includes('Platform Super Admin')
        );

        const authenticatedUser = {
          ...responsePayload.user,
          token: responsePayload.accessToken,
          isSuperAdmin: isUserSuperAdmin,
          role: isUserSuperAdmin
            ? 'Platform Super Admin'
            : responsePayload.user.role || 'Member',
          mustChangePassword: Boolean(
            responsePayload.requiresPasswordChange ?? responsePayload.user.mustChangePassword
          ),
          initialPassword: password.trim(),
        };

        if (onLoginSuccess) {
          onLoginSuccess(authenticatedUser);
        }
      }
    } catch (apiError) {
      const serverMsg =
        apiError.response?.data?.error?.message ||
        apiError.response?.data?.message ||
        apiError.message ||
        'Authentication failed. Please verify your credentials.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface font-body-base text-on-surface antialiased p-md">
      <main className="w-110 max-w-[94vw] mx-auto">
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
            loading={loading}
            onInputChange={() => {
              if (error) setError('');
            }}
          />
        </div>
      </main>
    </div>
  );
}
