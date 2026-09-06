import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function UserProfileSettingsModal({ isOpen, onClose, onLogout }) {
  const { authUser, updateAuthUser, isSuperAdmin, logout } = useApp();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'sessions'

  // Profile Form State
  const [name, setName] = useState(authUser?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (isOpen && authUser) {
      setName(authUser.name || '');
      setProfileSuccess('');
      setProfileError('');
      setPasswordSuccess('');
      setPasswordError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, authUser]);

  if (!isOpen || !authUser) return null;

  const initials = (authUser.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Password strength validation helpers
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError('');
      setProfileSuccess('');

      const userId = authUser.id || authUser._id;
      const res = await api.put(`/api/users/${userId}`, {
        name: name.trim(),
      });

      const updatedData = res.data?.data || {};
      const updatedUser = {
        ...authUser,
        name: updatedData.name || name.trim(),
      };

      updateAuthUser(updatedUser);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(
        err.response?.data?.message || err.message || 'Failed to update profile.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumber) {
      setPasswordError('New password does not meet security requirements.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError('');
      setPasswordSuccess('');

      const res = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
      setPasswordSuccess(res.data?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Refresh current session state with new token
      if (authUser) {
        updateAuthUser({
          ...authUser,
          token: newAccessToken || authUser.token,
          mustChangePassword: false,
        });
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || err.message || 'Failed to change password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-on-primary-fixed/40 backdrop-blur-sm p-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-border-subtle bg-surface-container-low shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Account &amp; Profile Settings
              </h2>
              <p className="text-[12px] text-on-surface-variant font-body-sm">
                Manage your credentials, security preferences, and workspace identity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle bg-surface px-lg pt-1 gap-md shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 py-2.5 px-2 text-sm font-label-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>Profile Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 py-2.5 px-2 text-sm font-label-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-1.5 py-2.5 px-2 text-sm font-label-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">devices</span>
            <span>Session &amp; Security</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-lg space-y-lg">
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-lg">
              {profileSuccess && (
                <div className="p-3 bg-success-bg border border-success-text/20 text-success-text rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-error-bg border border-error/20 text-error-text rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{profileError}</span>
                </div>
              )}

              {/* Avatar & Identity Banner */}
              <div className="p-md rounded-xl bg-surface-container-low border border-border-subtle flex items-center gap-md">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-label-bold text-xl flex items-center justify-center shadow-md shrink-0">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline-md text-on-surface text-base font-bold truncate">
                      {authUser.name}
                    </span>
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                        Platform Super Admin
                      </span>
                    )}
                  </div>
                  <span className="text-body-sm text-on-surface-variant text-xs truncate">
                    {authUser.email}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-success-text font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-text"></span>
                      Account Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-md">
                <div>
                  <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your Full Name"
                    className="w-full px-md py-2 bg-surface-container-lowest border border-border-subtle rounded-xl text-sm font-body-base text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={authUser.email || ''}
                    disabled
                    className="w-full px-md py-2 bg-surface-container-low border border-border-subtle rounded-xl text-sm font-body-base text-on-surface-variant opacity-80 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Email address is managed by platform administration.
                  </p>
                </div>
              </div>

              {/* Assigned Workspaces Overview */}
              {Array.isArray(authUser.workspaces) && authUser.workspaces.length > 0 && (
                <div>
                  <label className="block text-xs font-label-bold text-on-surface-variant mb-2 uppercase tracking-wider">
                    Assigned Workspaces &amp; Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {authUser.workspaces.map((ws, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center gap-2 text-xs"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          corporate_fare
                        </span>
                        <span className="font-semibold text-on-surface">{ws.name}</span>
                        <span className="text-on-surface-variant font-medium">({ws.role || 'Member'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-lg py-2 bg-primary text-on-primary font-label-bold rounded-xl shadow-sm hover:bg-on-primary-container transition-all flex items-center gap-1.5 cursor-pointer text-sm disabled:opacity-50"
                >
                  {profileLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">save</span>
                  )}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-lg">
              {passwordSuccess && (
                <div className="p-3 bg-success-bg border border-success-text/20 text-success-text rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-error-bg border border-error/20 text-error-text rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="p-md rounded-xl bg-surface-container-low border border-border-subtle text-xs text-on-surface-variant space-y-1">
                <div className="font-label-bold text-on-surface flex items-center gap-1 text-sm">
                  <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
                  <span>Password Policy &amp; Guidelines</span>
                </div>
                <p>
                  Passwords must be at least 8 characters long and contain both letters and numbers to protect your account.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full px-md py-2 pr-10 bg-surface-container-lowest border border-border-subtle rounded-xl text-sm font-body-base text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showCurrentPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full px-md py-2 pr-10 bg-surface-container-lowest border border-border-subtle rounded-xl text-sm font-body-base text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNewPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Live validation checkmarks */}
                {newPassword && (
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-success-text font-bold' : 'text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>8+ Chars</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasLetter ? 'text-success-text font-bold' : 'text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasLetter ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Letters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-success-text font-bold' : 'text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Numbers</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-md py-2 pr-10 bg-surface-container-lowest border border-border-subtle rounded-xl text-sm font-body-base text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-[11px] mt-1 flex items-center gap-1 ${passwordsMatch ? 'text-success-text' : 'text-error-text'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {passwordsMatch ? 'check' : 'close'}
                    </span>
                    <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading || !passwordsMatch || !hasMinLength || !hasLetter || !hasNumber}
                  className="px-lg py-2 bg-primary text-on-primary font-label-bold rounded-xl shadow-sm hover:bg-on-primary-container transition-all flex items-center gap-1.5 cursor-pointer text-sm disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Session & Security */}
          {activeTab === 'sessions' && (
            <div className="space-y-lg">
              <div className="p-md rounded-xl bg-surface-container-low border border-border-subtle flex items-start gap-md">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">laptop_mac</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-bold text-sm text-on-surface">Current Browser Session</span>
                    <span className="px-2 py-0.5 rounded-full bg-success-bg text-success-text text-[10px] font-bold">
                      Active Now
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {navigator.userAgent.slice(0, 70)}...
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Signed in as <span className="font-semibold text-on-surface">{authUser.email}</span>
                  </p>
                </div>
              </div>

              <div className="p-md rounded-xl bg-error-bg/30 border border-error/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-bold text-sm text-error-text block">
                      Sign Out of Platform
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Invalidate your active browser token and return to the login screen.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose?.();
                      if (typeof onLogout === 'function') {
                        onLogout();
                      } else if (typeof logout === 'function') {
                        logout();
                      }
                    }}
                    className="px-md py-1.5 bg-error text-on-error font-label-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 text-xs cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-low flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-lg py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold rounded-xl transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
