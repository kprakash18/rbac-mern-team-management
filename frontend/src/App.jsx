import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import LoginPage from './features/auth/pages/LoginPage';
import ForceChangePasswordPage from './features/auth/pages/ForceChangePasswordPage';
import AcceptInvitationPage from './features/invitation/pages/AcceptInvitationPage';
import WorkspacePage from './features/workspaces/pages/WorkspacePage';
import WorkspaceApp from './features/workspace-app/pages/WorkspaceApp';
import SuperAdminPage from './features/super-admin/pages/SuperAdminPage';

/**
 * Inner router — has access to AppContext and react-router hooks.
 */
function AppRoutes() {
  const { authUser, activeWorkspace, isSuperAdmin, login, logout, updateAuthUser, selectWorkspace, clearWorkspace } =
    useApp();
  const navigate = useNavigate();

  // Not logged in
  if (!authUser) {
    return (
      <Routes>
        <Route path="/invite" element={<AcceptInvitationPage />} />
        <Route path="*" element={<LoginPage onLoginSuccess={login} />} />
      </Routes>
    );
  }

  // Must change password before anything else
  if (authUser.mustChangePassword) {
    return (
      <ForceChangePasswordPage
        user={authUser}
        onPasswordChanged={updateAuthUser}
        onCancel={logout}
      />
    );
  }

  // Super Admin jumped into a workspace
  if (isSuperAdmin && activeWorkspace) {
    return (
      <WorkspaceApp
        workspace={activeWorkspace}
        currentUser={{ ...authUser, isTeamAdmin: true, teamRoleTitle: 'Super Admin' }}
        onLogout={clearWorkspace}
      />
    );
  }

  // Super Admin control plane
  if (isSuperAdmin) {
    return (
      <SuperAdminPage
        currentUser={authUser}
        onLogout={logout}
        onJumpIntoWorkspace={selectWorkspace}
      />
    );
  }

  // Regular employee — must pick a workspace first
  if (!activeWorkspace) {
    return (
      <WorkspacePage
        currentUser={authUser}
        onWorkspaceSelected={selectWorkspace}
        onLogout={logout}
      />
    );
  }

  // Regular employee in their workspace
  return (
    <Routes>
      <Route path="/invite" element={<AcceptInvitationPage />} />
      <Route
        path="/change-password"
        element={
          <ForceChangePasswordPage
            user={authUser}
            onPasswordChanged={(updated) => {
              updateAuthUser(updated);
              navigate('/');
            }}
            onCancel={logout}
          />
        }
      />
      <Route
        path="*"
        element={<WorkspaceApp workspace={activeWorkspace} currentUser={authUser} onLogout={logout} />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
