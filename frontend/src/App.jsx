import { useEffect, useState } from 'react';
import LoginPage from '@/features/auth/pages/LoginPage';
import AcceptInvitationPage from './features/invitation/pages/AcceptInvitationPage';
import WorkspacePage from './features/workspaces/pages/WorkspacePage';
import WorkspaceApp from './features/workspace-app/pages/WorkspaceApp';
import SuperAdminPage from './features/super-admin/pages/SuperAdminPage';

import ForceChangePasswordPage from './features/auth/pages/ForceChangePasswordPage';

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
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    try {
      const saved = localStorage.getItem('active_workspace');
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
    localStorage.removeItem('active_workspace');
    setAuthUser(null);
    setActiveWorkspace(null);
    setCurrentPath('/');
    window.history.pushState({}, '', '/');
  };

  if (currentPath === '/invite' || currentPath.startsWith('/invite')) {
    return (
      <AcceptInvitationPage
        onLoginSuccess={(user, workspace) => {
          setAuthUser(user);
          if (workspace) setActiveWorkspace(workspace);
          setCurrentPath('/');
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (currentPath === '/change-password' || currentPath === '/force-change-password') {
    return (
      <ForceChangePasswordPage
        user={authUser}
        onPasswordChanged={(updatedUser) => {
          setAuthUser(updatedUser);
          setCurrentPath('/');
          window.history.pushState({}, '', '/');
        }}
        onCancel={handleLogout}
      />
    );
  }

  // If not authenticated, render LoginPage
  if (!authUser) {
    return <LoginPage onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  // Forced password change required by Admin / First time setup
  if (authUser.mustChangePassword) {
    return (
      <ForceChangePasswordPage
        user={authUser}
        onPasswordChanged={(updatedUser) => {
          setAuthUser(updatedUser);
        }}
        onCancel={handleLogout}
      />
    );
  }

  // Super Admin who jumped into a workspace
  if (authUser.role === SUPER_ADMIN_ROLE && activeWorkspace) {
    return (
      <WorkspaceApp
        workspace={activeWorkspace}
        currentUser={{
          ...authUser,
          isTeamAdmin: true,
          teamRoleTitle: 'Super Admin',
        }}
        onLogout={() => {
          setActiveWorkspace(null);
          localStorage.removeItem('active_workspace');
        }}
      />
    );
  }

  // Super Admin → Control Plane
  if (authUser.role === SUPER_ADMIN_ROLE) {
    return (
      <SuperAdminPage
        currentUser={authUser}
        onLogout={handleLogout}
        onJumpIntoWorkspace={(ws) => {
          setActiveWorkspace(ws);
          try {
            localStorage.setItem('active_workspace', JSON.stringify(ws));
          } catch {}
        }}
      />
    );
  }

  // Regular employee → Workspace selector first, then Workspace App
  if (!activeWorkspace) {
    return (
      <WorkspacePage
        currentUser={authUser}
        onWorkspaceSelected={(ws) => {
          setActiveWorkspace(ws);
          try {
            localStorage.setItem('active_workspace', JSON.stringify(ws));
          } catch {}
        }}
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
