import { useEffect, useState } from 'react';
import LoginPage from '@/features/auth/pages/LoginPage';
import AcceptInvitationPage from './features/invitation/pages/AcceptInvitationPage';
import WorkspacePage from './features/workspaces/pages/WorkspacePage';
import WorkspaceApp from './features/workspace-app/pages/WorkspaceApp';
import SuperAdminPage from './features/super-admin/pages/SuperAdminPage';

const SUPER_ADMIN_ROLE = 'Platform Super Admin';

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

  // Employee workspace selection: null = show selector, object = show workspace app
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_session');
    setAuthUser(null);
    setActiveWorkspace(null);
  };

  if (currentPath === '/invite') {
    return <AcceptInvitationPage />;
  }

  // If not authenticated, render LoginPage
  if (!authUser) {
    return <LoginPage onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  // Super Admin → Control Plane
  if (authUser.role === SUPER_ADMIN_ROLE) {
    return <SuperAdminPage currentUser={authUser} onLogout={handleLogout} />;
  }

  // Regular employee → Workspace selector first, then Workspace App
  if (!activeWorkspace) {
    return (
      <WorkspacePage
        currentUser={authUser}
        onWorkspaceSelected={(ws) => setActiveWorkspace(ws)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <WorkspaceApp
      workspace={activeWorkspace}
      currentUser={authUser}
      onLogout={handleLogout}
    />
  );
}
