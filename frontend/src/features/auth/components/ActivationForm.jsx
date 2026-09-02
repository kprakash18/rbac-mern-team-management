import { useState } from 'react';

export default function ActivationForm({ onSubmit, onInputChange }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Compute password strength dynamically
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', width: '0%', color: 'transparent', textColor: 'inherit' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { label: 'Weak', width: '25%', color: '#ef4444', textColor: 'rgb(239, 68, 68)' };
    if (score <= 2) return { label: 'Fair', width: '50%', color: '#f59e0b', textColor: 'rgb(245, 158, 11)' };
    if (score === 3) return { label: 'Good', width: '75%', color: '#3b82f6', textColor: 'rgb(59, 130, 246)' };
    return { label: 'Strong', width: '100%', color: '#10b981', textColor: 'rgb(5, 150, 105)' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ newPassword, confirmPassword });
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (onInputChange) onInputChange();
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (onInputChange) onInputChange();
  };

  return (
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
            onChange={handleNewPasswordChange}
            required
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-outline-variant hover:text-on-surface transition-colors cursor-pointer"
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label="Toggle new password visibility"
          >
            <span className="material-symbols-outlined text-[20px]" id="icon-new-password">
              {showNewPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </div>

      {/* Password Strength Indicator */}
      {newPassword && (
        <div className="flex flex-col gap-unit animate-in fade-in">
          <div className="flex justify-between items-center">
            <span className="text-label-sm font-label-sm text-on-surface-variant">
              Password strength
            </span>
            <span
              className="text-label-sm font-label-sm text-on-surface-variant font-medium"
              style={{ color: strength.textColor }}
            >
              {strength.label}
            </span>
          </div>
          <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{ width: strength.width, backgroundColor: strength.color }}
            />
          </div>
        </div>
      )}

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
            onChange={handleConfirmPasswordChange}
            required
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-outline-variant hover:text-on-surface transition-colors cursor-pointer"
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label="Toggle confirm password visibility"
          >
            <span className="material-symbols-outlined text-[20px]" id="icon-confirm-password">
              {showConfirmPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </div>

      {/* Action Submit Button */}
      <button
        className="w-full h-12 mt-stack-sm bg-surface-container-highest text-outline font-label-md text-label-md rounded-md transition-colors hover:bg-surface-container-highest cursor-pointer"
        style={{ backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)' }}
        type="submit"
      >
        Update password
      </button>
    </form>
  );
}
