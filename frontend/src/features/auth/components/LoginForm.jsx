import { useState } from 'react';

export default function LoginForm({ onSubmit, onInputChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password, rememberMe });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (onInputChange) onInputChange();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (onInputChange) onInputChange();
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {/* Email Input */}
      <div className="flex flex-col gap-unit">
        <label className="font-label-md text-on-surface" htmlFor="email">
          Email address
        </label>
        <input
          className="px-stack-md py-2.5 rounded-md border border-outline-variant bg-surface-container-lowest text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/50"
          id="email"
          placeholder="you@company.com"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-unit">
        <div className="flex items-center justify-between">
          <label className="font-label-md text-on-surface" htmlFor="password">
            Password
          </label>
          <a className="font-label-sm text-primary hover:underline" href="#forgot">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <input
            className="w-full px-stack-md py-2.5 rounded-md border border-outline-variant bg-surface-container-lowest text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-10"
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <button
            aria-label="Toggle password visibility"
            className="absolute inset-y-0 right-0 px-stack-sm flex items-center text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center gap-stack-sm">
        <div className="relative flex items-center justify-center">
          <input
            className="peer appearance-none w-4 h-4 rounded-xs border border-outline-variant checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all cursor-pointer"
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span
            className="material-symbols-outlined text-[14px] text-on-primary absolute pointer-events-none opacity-0 peer-checked:opacity-100"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            check
          </span>
        </div>
        <label
          className="font-body-md text-on-surface-variant cursor-pointer select-none"
          htmlFor="remember"
        >
          Remember me
        </label>
      </div>

      {/* Submit Button */}
      <button
        className="w-full bg-primary text-on-primary font-label-md py-2.5 px-stack-md rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all mt-stack-sm flex items-center justify-center gap-stack-sm group cursor-pointer"
        type="submit"
      >
        Sign In
        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
          arrow_forward
        </span>
      </button>
    </form>
  );
}
