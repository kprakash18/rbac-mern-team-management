import { useEffect, useState } from 'react';
import LoginPage from '@/features/auth/pages/LoginPage';
import AcceptInvitationPage from './features/invitation/pages/AcceptInvitationPage';
import WorkspacePage from './features/workspaces/pages/WorkspacePage';
import SuperAdminPage from './features/super-admin/pages/SuperAdminPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_session');
    setAuthUser(null);
  };

  if (currentPath === '/invite') {
    return <AcceptInvitationPage />;
  }

  if (currentPath === '/workspaces') {
    return <WorkspacePage />;
  }

  // If not authenticated, render LoginPage
  if (!authUser) {
    return <LoginPage onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  // If authenticated, render Super Admin Control Plane
  return <SuperAdminPage currentUser={authUser} onLogout={handleLogout} />;
}
