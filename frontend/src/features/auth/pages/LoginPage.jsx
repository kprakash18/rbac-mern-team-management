import { useState } from 'react';
import AuthHeader from '../components/AuthHeader';
import AuthErrorBanner from '../components/AuthErrorBanner';
import LoginForm from '../components/LoginForm';
import { USE_MOCK_DATA, MOCK_USERS } from '../constants/auth.constants';

export default function LoginPage() {
  const [error, setError] = useState('');

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
        setError('Invalid email or password.');
        return;
      }

      if (matchedUser.accountStatus === 'SUSPENDED') {
        setError('Your account is currently suspended. Please contact your administrator.');
        return;
      }

      if (matchedUser.mustChangePassword) {
        console.log('Redirecting to /activate-account for user:', matchedUser);
        return;
      }

      console.log('Login successful! Redirecting to /workspaces for user:', matchedUser, { rememberMe });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface font-body-md text-on-surface antialiased">
      <div className="mb-stack-lg animate-fade-in text-center"></div>
      <main className="w-full max-w-7xl mx-auto px-container-margin">
        <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-120px)] py-stack-lg">
          <div className="w-full max-w-110 bg-surface-container-lowest rounded-[10px] shadow-md transition-shadow duration-300 hover:shadow-lg border border-surface-container-highest p-[32px]">
            
            {/* Header Component */}
            <AuthHeader
              title="Sign in to your account"
              subtitle="Enter your email and password to access your team workspaces."
            />

            {/* Error Feedback Component */}
            <AuthErrorBanner message={error} />

            {/* Form Component */}
            <LoginForm
              onSubmit={handleLogin}
              onInputChange={() => {
                if (error) setError('');
              }}
            />

            <div className="mt-stack-lg text-center"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
