import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './context/AppContext.jsx';
import { useApp } from './context/useApp';
import { queryClient } from './lib/queryClient';
import { SkeletonCard } from '@/shared/components';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const ForceChangePasswordPage = lazy(() => import('./features/auth/pages/ForceChangePasswordPage'));
const SuspendedAccountPage = lazy(() => import('./features/auth/pages/SuspendedAccountPage'));
const AcceptInvitationPage = lazy(() => import('./features/invitation/pages/AcceptInvitationPage'));
const WorkspacePage = lazy(() => import('./features/workspaces/pages/WorkspacePage'));
const WorkspaceApp = lazy(() => import('./features/workspace-app/pages/WorkspaceApp'));
const SuperAdminPage = lazy(() => import('./features/super-admin/pages/SuperAdminPage'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}


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
      <Route path="/invite" element={<AcceptInvitationPage />} />

      {!authUser && <Route path="*" element={<LoginPage onLoginSuccess={login} />} />}

      {authUser && isSuspended && (
        <Route
          path="*"
          element={<SuspendedAccountPage user={authUser} onLogout={logout} />}
        />
      )}

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          <Suspense fallback={<PageFallback />}>
            <AppRoutes />
          </Suspense>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

