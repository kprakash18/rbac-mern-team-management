import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Modal, Button, Badge, Avatar } from '@/shared/components';

export default function UserProfileSettingsModal({ isOpen, onClose, onLogout }) {
  const { authUser, updateAuthUser, isSuperAdmin, logout } = useApp();
  const [activeTab, setActiveTab] = useState('profile');

  const [name, setName] = useState(authUser?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    try {
      setProfileLoading(true);
      setProfileError('');
      const userId = authUser.id || authUser._id;
      const res = await api.put(`/api/users/${userId}`, { name: name.trim() });
      const updatedData = res.data?.data || {};
      updateAuthUser({ ...authUser, name: updatedData.name || name.trim() });
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile.');
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
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('Password must be at least 8 characters with letters and numbers.');
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
      const res = await api.post('/api/auth/change-password', { currentPassword, newPassword });
      const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (authUser) {
        updateAuthUser({ ...authUser, token: newAccessToken || authUser.token, mustChangePassword: false });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoutAction = () => {
    onClose?.();
    if (onLogout) onLogout();
    else if (logout) logout();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account & Profile Settings" subtitle="Manage your credentials, security, and workspace identity">
      <div className="flex border-b border-border-subtle mb-4 gap-2">
        {['profile', 'security', 'sessions'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-3 text-sm font-label-bold capitalize border-b-2 cursor-pointer transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab === 'profile' ? 'Profile Details' : tab === 'security' ? 'Change Password' : 'Sessions'}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {profileSuccess && <div className="p-3 bg-success-bg text-success-text rounded-lg text-sm">{profileSuccess}</div>}
          {profileError && <div className="p-3 bg-error-bg text-error-text rounded-lg text-sm">{profileError}</div>}

          <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center gap-3">
            <Avatar name={authUser.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface">{authUser.name}</span>
                {isSuperAdmin && <Badge variant="primary">Super Admin</Badge>}
              </div>
              <span className="text-body-sm text-on-surface-variant block">{authUser.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase">Email Address</label>
            <input
              type="email"
              value={authUser.email || ''}
              disabled
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface-variant opacity-80 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-border-subtle">
            <Button type="submit" disabled={profileLoading} icon="save">
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordSuccess && <div className="p-3 bg-success-bg text-success-text rounded-lg text-sm">{passwordSuccess}</div>}
          {passwordError && <div className="p-3 bg-error-bg text-error-text rounded-lg text-sm">{passwordError}</div>}

          <div>
            <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none"
              />
              <button type="button" onClick={() => setShowCurrentPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">{showCurrentPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase">New Password</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none"
              />
              <button type="button" onClick={() => setShowNewPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">{showNewPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-label-bold text-on-surface-variant mb-1 uppercase">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-border-subtle">
            <Button type="submit" disabled={passwordLoading} icon="lock">
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">laptop</span>
              <div>
                <span className="text-sm font-semibold text-on-surface block">Current Web Session</span>
                <span className="text-xs text-on-surface-variant">Active now</span>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="pt-2 border-t border-border-subtle flex justify-end">
            <Button variant="danger" icon="logout" onClick={handleLogoutAction}>
              Log Out of System
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
