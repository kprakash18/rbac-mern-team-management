import { useState } from 'react';

export default function NewUserCard({ invitation, onJoin }) {
  const {
    workspaceName = 'Acme Engineering',
    role = 'Developer',
    email = 'you@company.com',
  } = invitation || {};

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Live password validation rules
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const isCommonPassword = ['password', '12345678', 'admin123'].includes(
    password.toLowerCase()
  );
  const isPasswordValid = hasMinLength && hasNumberOrSymbol && !isCommonPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !isPasswordValid) return;
    if (onJoin) {
      onJoin({ email, fullName, password });
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-surface-container-lowest rounded-xl shadow-xl p-section-gap">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-surface-container rounded-xl flex items-center justify-center mb-stack-lg shadow-sm">
          <img
            alt={`${workspaceName} Logo`}
            className="w-10 h-10 object-contain mix-blend-multiply"
            src="/b2b_saas_logo.png"
            />

        </div>
        <h1 className="font-headline-md text-headline-md text-on-surface">
          Join Workspace
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">
          {workspaceName} invited you as a {role}.
        </p>
      </div>

      {/* Workspace Summary Block */}
      <div className="mt-stack-lg bg-surface-container rounded-lg p-stack-md flex flex-col gap-stack-sm shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-on-surface-variant">
            Workspace
          </span>
          <span className="font-label-md text-label-md text-on-surface font-semibold">
            {workspaceName}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-on-surface-variant">
            Role
          </span>
          <span className="font-label-sm text-label-sm text-on-surface bg-surface-container-highest px-2 py-1 rounded-full uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>

      {/* Form */}
      <form className="mt-section-gap flex flex-col gap-stack-lg" onSubmit={handleSubmit}>
        {/* Email (Read-only) */}
        <div className="flex flex-col gap-stack-sm">
          <label className="font-label-md text-label-md text-on-surface">
            Email Address
          </label>
          <input
            className="h-12 px-stack-md rounded-lg bg-surface-container text-on-surface-variant ring-1 ring-outline-variant/50 cursor-not-allowed font-body-md text-body-md outline-none focus:ring-0"
            disabled
            type="email"
            value={email}
          />
        </div>

        {/* Full Name */}
        <div className="flex flex-col gap-stack-sm">
          <label className="font-label-md text-label-md text-on-surface">
            Full Name
          </label>
          <input
            className="h-12 px-stack-md rounded-lg bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-shadow font-body-md text-body-md"
            placeholder="Jane Doe"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-stack-sm">
          <label className="font-label-md text-label-md text-on-surface flex justify-between">
            <span>Password</span>
          </label>
          <div className="relative">
            <input
              className="w-full h-12 pl-stack-md pr-12 rounded-lg bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant focus:ring-2 focus:ring-primary focus:outline-none transition-shadow font-body-md text-body-md"
              placeholder="Create a secure password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface flex items-center justify-center p-1 rounded-full transition-colors cursor-pointer"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>

          {/* Dynamic Password Requirements Checklist */}
          <div className="mt-stack-sm bg-surface-container-low p-stack-sm rounded-lg flex flex-col gap-2">
            <div
              className={`flex items-center gap-2 font-label-sm text-label-sm ${
                hasMinLength ? 'text-on-surface' : 'text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>At least 8 characters</span>
            </div>

            <div
              className={`flex items-center gap-2 font-label-sm text-label-sm ${
                hasNumberOrSymbol ? 'text-on-surface' : 'text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {hasNumberOrSymbol ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Contains a number or symbol</span>
            </div>

            <div
              className={`flex items-center gap-2 font-label-sm text-label-sm ${
                password && !isCommonPassword ? 'text-on-surface' : 'text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {password && !isCommonPassword ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Not a commonly used password</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="mt-stack-md w-full h-12 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          type="submit"
          disabled={!fullName.trim() || !isPasswordValid}
        >
          <span>Join Workspace</span>
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      </form>
    </div>
  );
}
