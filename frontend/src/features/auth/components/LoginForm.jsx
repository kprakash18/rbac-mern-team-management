import { useState, useEffect } from 'react';

export default function LoginForm({ onSubmit, onInputChange, initialValues }) {
  const [email, setEmail] = useState(initialValues?.email || '');
  const [password, setPassword] = useState(initialValues?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.email !== undefined) setEmail(initialValues.email);
      if (initialValues.password !== undefined) setPassword(initialValues.password);
    }
  }, [initialValues]);

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
    <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
      {/* Email Input */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[13px] font-semibold text-on-surface" htmlFor="email">
          Email address
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
          id="email"
          placeholder="admin@platform.internal"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-semibold text-on-surface" htmlFor="password">
            Password
          </label>
          <a className="text-[12px] text-primary hover:underline font-medium" href="#forgot">
            Forgot password?
          </a>
        </div>
        <div className="relative w-full">
          <input
            className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all pr-10"
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            required
          />
          <button
            aria-label="Toggle password visibility"
            className="absolute inset-y-0 right-0 px-3 flex items-center text-outline hover:text-on-surface focus:outline-none cursor-pointer"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-symbols-outlined text-[18px]">
              {showPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center gap-2">
        <input
          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <label
          className="text-[13px] text-on-surface-variant cursor-pointer select-none"
          htmlFor="remember"
        >
          Remember me
        </label>
      </div>

      {/* Submit Button */}
      <button
        className="w-full bg-primary text-on-primary font-bold py-2.5 px-4 rounded-lg hover:bg-on-primary-fixed focus:outline-none focus:ring-2 focus:ring-primary transition-all mt-2 flex items-center justify-center gap-2 group cursor-pointer shadow-sm text-[14px]"
        type="submit"
      >
        <span>Sign In</span>
        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
          arrow_forward
        </span>
      </button>
    </form>
  );
}
