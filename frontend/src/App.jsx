import { useEffect, useState } from 'react';
import LoginPage from '@/features/auth/pages/LoginPage';
import AcceptInvitationPage from './features/invitation/pages/AcceptInvitationPage';
import WorkspacePage from './features/workspaces/pages/WorkspacePage';
import SuperAdminPage from './features/super-admin/pages/SuperAdminPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPath === '/login') {
    return <LoginPage />;
  }

  if (currentPath === '/invite') {
    return <AcceptInvitationPage />;
  }

  if (currentPath === '/workspaces') {
    return <WorkspacePage />;
  }

  // Mounted at /superadmin and default for superadmin branch
  return <SuperAdminPage />;
}
