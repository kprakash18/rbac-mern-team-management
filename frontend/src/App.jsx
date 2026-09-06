import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { useApp } from './context/useApp';
import ErrorBoundary from './components/ErrorBoundary';
import RouteLoadingFallback from './components/shared/RouteLoadingFallback';

// Route-level dynamic chunking (Milestone M6)
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const ForceChangePasswordPage = lazy(() => import('./features/auth/pages/ForceChangePasswordPage'));
const SuspendedAccountPage = lazy(() => import('./features/auth/pages/SuspendedAccountPage'));
const AcceptInvitationPage = lazy(() => import('./features/invitation/pages/AcceptInvitationPage'));
const WorkspacePage = lazy(() => import('./features/workspaces/pages/WorkspacePage'));
const WorkspaceApp = lazy(() => import('./features/workspace-app/pages/WorkspaceApp'));
const SuperAdminPage = lazy(() => import('./features/super-admin/pages/SuperAdminPage'));

/**
 * Inner router — has access to AppContext and react-router hooks.
 */
function AppRoutes() {
  const {
    authUser,
    activeWorkspace,
    isSuperAdmin,
    login,
    logout,
    updateAuthUser,
    selectWorkspace,
    clearWorkspace,
  } = useApp();
  const navigate = useNavigate();

  const isSuspended = Boolean(
    authUser?.accountStatus === 'SUSPENDED' ||
      authUser?.status === 'Suspended' ||
      authUser?.status?.toLowerCase() === 'suspended' ||
      authUser?.statusType?.toLowerCase() === 'suspended'
  );

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* 1. Global Public Routes */}
        <Route path="/invite" element={<AcceptInvitationPage />} />
        <Route
          path="/login"
          element={!authUser ? <LoginPage onLoginSuccess={login} /> : <Navigate to="/" replace />}
        />

        {/* 2. Unauthenticated State */}
        {!authUser && <Route path="*" element={<LoginPage onLoginSuccess={login} />} />}

        {/* 3. Suspended Account Screen */}
        {authUser && isSuspended && (
          <Route
            path="*"
            element={<SuspendedAccountPage user={authUser} onLogout={logout} />}
          />
        )}

        {/* 4. Mandatory Password Change */}
        {authUser && !isSuspended && authUser?.mustChangePassword && (
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

        {/* 5. Protected Authenticated Shared Routes */}
        {authUser && !isSuspended && !authUser.mustChangePassword && (
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

            {isSuperAdmin && (
              <Route
                path="/admin"
                element={
                  <SuperAdminPage
                    currentUser={authUser}
                    onLogout={logout}
                    onJumpIntoWorkspace={selectWorkspace}
                  />
                }
              />
            )}

            {/* 6. Active Workspace View */}
            {activeWorkspace ? (
              <Route
                path="*"
                element={
                  <WorkspaceApp
                    workspace={activeWorkspace}
                    currentUser={authUser}
                    onLogout={isSuperAdmin ? clearWorkspace : logout}
                  />
                }
              />
            ) : isSuperAdmin ? (
              /* 7. Super Admin Default Control Plane */
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
            ) : (
              /* 8. Regular Member Default Workspace Picker */
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
          </>
        )}
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
