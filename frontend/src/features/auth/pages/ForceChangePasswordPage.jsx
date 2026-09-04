import { useState } from 'react';

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1WLIu2LRhEp60WPBOijAnaRzKBTf6_iGJW5f7YjKdP4j5AkV5ph5c6SGH5kSkBQrLEUAXS45mO8ubfByXHXeO2diwg7HJFE0G6blLrN4_AlWrhkJpz4_jJxaoy-1w8GLSLpQwmST0KeRyihgg8Q4-3jjEXkmZ7l8lZhc8B64Ytsk6GMdVwbgnBRFJ1gE1Tkc8o3qiLad7T0iBiWGW8XkaRqXcMiRlf3VcvAE-oAlih3NTl3Hsb1MpJDCGZi';

export default function ForceChangePasswordPage({ user, onPasswordChanged, onCancel }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength calculation
  const calculateStrength = (pwd) => {
    if (!pwd) return { label: 'Weak', width: '0%', color: '#ef4444' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { label: 'Weak', width: '25%', color: '#ef4444' };
    if (score === 2) return { label: 'Fair', width: '50%', color: '#f59e0b' };
    if (score === 3) return { label: 'Good', width: '75%', color: '#10b981' };
    return { label: 'Strong', width: '100%', color: '#10b981' };
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    const updatedUser = {
      ...(user || {
        id: 'usr-invited',
        email: 'invited@example.com',
        name: 'Invited User',
        role: 'Developer',
        accountStatus: 'ACTIVE',
      }),
      mustChangePassword: false,
      accountStatus: 'ACTIVE',
      password: newPassword,
    };

    localStorage.setItem('auth_session', JSON.stringify(updatedUser));

    try {
      const stored = localStorage.getItem('platform_users_list');
      if (stored) {
        const list = JSON.parse(stored);
        const updatedList = list.map((u) =>
          u.email.toLowerCase() === updatedUser.email.toLowerCase()
            ? {
                ...u,
                mustChangePassword: false,
                password: newPassword,
                status: 'Active',
                statusType: 'active',
              }
            : u
        );
        localStorage.setItem('platform_users_list', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error(err);
    }

    if (onPasswordChanged) {
      onPasswordChanged(updatedUser);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="font-body-md text-on-background min-h-screen flex flex-col bg-surface" style={{ backgroundColor: 'rgb(248, 250, 252)' }}>
      <header className="w-full py-container-margin flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-stack-sm">
          <img
            alt="ACME Logo"
            className="h-10 w-auto object-contain"
            src={LOGO_URL}
            onError={(e) => {
              e.currentTarget.src = '/b2b_saas_logo.png';
            }}
          />
          <span className="font-headline-sm text-headline-sm text-primary uppercase tracking-widest">
            Acme Corp
          </span>
        </div>
      </header>

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
            {/* Header section */}
            <div className="flex flex-col items-center mb-stack-lg">
              <div
                className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-stack-md"
                style={{ backgroundColor: 'rgb(241, 245, 249)' }}
              >
                <img
                  alt="Company Logo"
                  className="w-8 h-8 object-contain mix-blend-multiply"
                  src={LOGO_URL}
                  onError={(e) => {
                    e.currentTarget.src = '/b2b_saas_logo.png';
                  }}
                />
              </div>
              <h2
                className="font-headline-sm text-headline-sm text-on-surface mb-unit text-center"
                style={{
                  color: 'rgb(15, 23, 42)',
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em',
                }}
              >
                Secure your account
              </h2>
              <p
                className="font-body-md text-body-md text-on-surface-variant text-center max-w-[320px]"
                style={{ color: 'rgb(71, 85, 105)', lineHeight: 1.6 }}
              >
                Please set a new password to replace your temporary one.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-stack-md p-stack-sm rounded-md bg-error-container text-error text-label-sm font-label-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Section */}
            <form className="flex flex-col gap-stack-lg" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="flex flex-col gap-stack-sm">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="new-password"
                  style={{ color: 'rgb(71, 85, 105)' }}
                >
                  New Password
                </label>
                <div className="relative w-full">
                  <input
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors pr-10 focus:ring-2"
                    id="new-password"
                    placeholder="••••••••"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-outline-variant hover:text-on-surface transition-colors cursor-pointer"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    type="button"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px]" id="icon-new-password">
                      {showNewPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password strength */}
              <div className="flex flex-col gap-unit">
                <div className="flex justify-between items-center">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">
                    Password strength
                  </span>
                  <span
                    className="text-label-sm font-label-sm text-on-surface-variant"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: strength.width,
                      backgroundColor: strength.color,
                    }}
                  ></div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-stack-sm">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="confirm-password"
                  style={{ color: 'rgb(71, 85, 105)' }}
                >
                  Confirm Password
                </label>
                <div className="relative w-full">
                  <input
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors pr-10 focus:ring-2"
                    id="confirm-password"
                    placeholder="••••••••"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-outline-variant hover:text-on-surface transition-colors cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px]" id="icon-confirm-password">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action */}
              <button
                className="w-full h-12 mt-stack-sm bg-surface-container-highest text-outline font-label-md text-label-md rounded-md transition-colors hover:bg-surface-container-highest cursor-pointer"
                style={{ backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)' }}
                type="submit"
              >
                Update password
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface text-center cursor-pointer -mt-2"
                >
                  Return to sign in
                </button>
              )}
            </form>
          </div>
        </div>
      </main>

      <footer className="py-stack-lg text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Secure Enterprise SaaS Environment • © 2024 Acme Corp
        </p>
      </footer>
    </div>
  );
}
