import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { useApp } from './context/useApp';
import LoginPage from './features/auth/pages/LoginPage';
import ForceChangePasswordPage from './features/auth/pages/ForceChangePasswordPage';
import SuspendedAccountPage from './features/auth/pages/SuspendedAccountPage';
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

  const isSuspended = Boolean(
    authUser?.accountStatus === 'SUSPENDED' ||
    authUser?.status === 'Suspended' ||
    authUser?.status?.toLowerCase() === 'suspended' ||
    authUser?.statusType?.toLowerCase() === 'suspended'
  );

  return (
    <Routes>
      {/* 1. Global Public Route: Accept Invitation */}
      <Route path="/invite" element={<AcceptInvitationPage />} />

      {/* 2. Unauthenticated State */}
      {!authUser && <Route path="*" element={<LoginPage onLoginSuccess={login} />} />}

      {/* 3. Suspended Account Screen */}
      {authUser && isSuspended && (
        <Route
          path="*"
          element={<SuspendedAccountPage user={authUser} onLogout={logout} />}
        />
      )}

      {/* 3. Mandatory Password Change */}
      {authUser?.mustChangePassword && (
        <Route
          path="*"
          element={
            <ForceChangePasswordPage
              user={authUser}
              onPasswordChanged={updateAuthUser}
              onCancel={logout}
            />
          }
        />
      )}

      {/* 4. Active Workspace View (Super Admin or Member) */}
      {authUser && !authUser.mustChangePassword && activeWorkspace && (
        <>
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
            element={
              <WorkspaceApp
                workspace={activeWorkspace}
                currentUser={{
                  ...authUser,
                  isTeamAdmin: Boolean(
                    isSuperAdmin ||
                    activeWorkspace?.isTeamAdmin ||
                    activeWorkspace?.role === 'Team Admin' ||
                    activeWorkspace?.role?.toLowerCase().includes('admin')
                  ),
                  isSuperAdmin: isSuperAdmin,
                  teamRoleTitle: isSuperAdmin ? 'Super Admin' : activeWorkspace?.role || 'Developer',
                  teamRole: isSuperAdmin ? 'Super Admin' : activeWorkspace?.role || 'Developer',
                }}
                onLogout={isSuperAdmin ? clearWorkspace : logout}
              />
            }
          />
        </>
      )}

      {/* 5. Explicit Workspaces Picker route */}
      {authUser && !authUser.mustChangePassword && !activeWorkspace && (
        <>
          <Route
            path="/workspaces"
            element={
              <WorkspacePage
                currentUser={authUser}
                onWorkspaceSelected={selectWorkspace}
                onLogout={logout}
              />
            }
          />
          <Route
            path="/workspace"
            element={
              <WorkspacePage
                currentUser={authUser}
                onWorkspaceSelected={selectWorkspace}
                onLogout={logout}
              />
            }
          />
        </>
      )}

      {/* 6. Super Admin Default Control Plane */}
      {authUser && !authUser.mustChangePassword && isSuperAdmin && !activeWorkspace && (
        <Route
          path="*"
          element={
            <SuperAdminPage
              currentUser={authUser}
              onLogout={logout}
              onJumpIntoWorkspace={selectWorkspace}
            />
          }
        />
      )}

      {/* 7. Regular Member Default Workspace Picker */}
      {authUser && !authUser.mustChangePassword && !isSuperAdmin && !activeWorkspace && (
        <Route
          path="*"
          element={
            <WorkspacePage
              currentUser={authUser}
              onWorkspaceSelected={selectWorkspace}
              onLogout={logout}
            />
          }
        />
      )}
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
