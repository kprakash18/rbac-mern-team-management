import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
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

function WorkspaceAppWrapper() {
  const { teamId } = useParams();
  const { authUser, activeWorkspace, isSuperAdmin, logout, clearWorkspace } = useApp();
  const navigate = useNavigate();

  const isTeamAdmin = Boolean(
    isSuperAdmin ||
    activeWorkspace?.isTeamAdmin ||
    activeWorkspace?.role === 'Team Admin' ||
    activeWorkspace?.role?.toLowerCase().includes('admin')
  );

  const resolvedWorkspace = activeWorkspace || { _id: teamId, id: teamId, name: 'Workspace' };

  return (
    <WorkspaceApp
      workspace={resolvedWorkspace}
      currentUser={{
        ...authUser,
        isTeamAdmin,
        isSuperAdmin,
        teamRoleTitle: isSuperAdmin ? 'Super Admin' : resolvedWorkspace?.role || 'Developer',
        teamRole: isSuperAdmin ? 'Super Admin' : resolvedWorkspace?.role || 'Developer',
      }}
      onLogout={isSuperAdmin ? () => { clearWorkspace(); navigate('/workspaces'); } : logout}
    />
  );
}

function SuperAdminWrapper() {
  const { authUser, logout, selectWorkspace } = useApp();
  const navigate = useNavigate();

  return (
    <SuperAdminPage
      currentUser={authUser}
      onLogout={logout}
      onJumpIntoWorkspace={(ws) => {
        selectWorkspace(ws);
        navigate(`/workspace/${ws._id || ws.id}/dashboard`);
      }}
    />
  );
}

function RootRedirect() {
  const { authUser, activeWorkspace, isSuperAdmin } = useApp();

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  const isSuspended = Boolean(
    authUser?.accountStatus === 'SUSPENDED' ||
    authUser?.status === 'Suspended' ||
    authUser?.status?.toLowerCase() === 'suspended' ||
    authUser?.statusType?.toLowerCase() === 'suspended'
  );
  if (isSuspended) {
    return <Navigate to="/suspended" replace />;
  }

  if (authUser?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isSuperAdmin && !activeWorkspace) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (activeWorkspace) {
    return <Navigate to={`/workspace/${activeWorkspace._id || activeWorkspace.id}/dashboard`} replace />;
  }

  return <Navigate to="/workspaces" replace />;
}

function AppRoutes() {
  const { authUser, login, logout, updateAuthUser, selectWorkspace } = useApp();
  const navigate = useNavigate();

  const isSuspended = Boolean(
    authUser?.accountStatus === 'SUSPENDED' ||
    authUser?.status === 'Suspended' ||
    authUser?.status?.toLowerCase() === 'suspended' ||
    authUser?.statusType?.toLowerCase() === 'suspended'
  );

  return (
    <Routes>
      {/* Public / Invitation Routes */}
      <Route path="/invite" element={<AcceptInvitationPage />} />

      {/* Unauthenticated Routes */}
      <Route
        path="/login"
        element={
          authUser ? (
            <RootRedirect />
          ) : (
            <LoginPage
              onLoginSuccess={(user) => {
                login(user);
                if (user?.isSuperAdmin) {
                  navigate('/admin/dashboard');
                } else {
                  navigate('/workspaces');
                }
              }}
            />
          )
        }
      />

      {/* Account Status Guards */}
      <Route
        path="/suspended"
        element={
          authUser && isSuspended ? (
            <SuspendedAccountPage user={authUser} onLogout={logout} />
          ) : (
            <RootRedirect />
          )
        }
      />

      <Route
        path="/change-password"
        element={
          authUser ? (
            <ForceChangePasswordPage
              user={authUser}
              onPasswordChanged={(updated) => {
                updateAuthUser(updated);
                navigate('/');
              }}
              onCancel={logout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Workspace Selection Hub */}
      <Route
        path="/workspaces"
        element={
          !authUser ? (
            <Navigate to="/login" replace />
          ) : isSuspended ? (
            <Navigate to="/suspended" replace />
          ) : authUser.mustChangePassword ? (
            <Navigate to="/change-password" replace />
          ) : (
            <WorkspacePage
              currentUser={authUser}
              onWorkspaceSelected={(ws) => {
                selectWorkspace(ws);
                navigate(`/workspace/${ws._id || ws.id}/dashboard`);
              }}
              onLogout={logout}
            />
          )
        }
      />

      {/* Workspace Multi-Page Nested Routes */}
      <Route
        path="/workspace/:teamId/:view"
        element={
          !authUser ? (
            <Navigate to="/login" replace />
          ) : isSuspended ? (
            <Navigate to="/suspended" replace />
          ) : authUser.mustChangePassword ? (
            <Navigate to="/change-password" replace />
          ) : (
            <WorkspaceAppWrapper />
          )
        }
      />
      <Route
        path="/workspace/:teamId"
        element={
          !authUser ? (
            <Navigate to="/login" replace />
          ) : isSuspended ? (
            <Navigate to="/suspended" replace />
          ) : (
            <WorkspaceAppWrapper />
          )
        }
      />

      {/* Super Admin Multi-Page Nested Routes */}
      <Route
        path="/admin/:section"
        element={
          !authUser ? (
            <Navigate to="/login" replace />
          ) : isSuspended ? (
            <Navigate to="/suspended" replace />
          ) : authUser.mustChangePassword ? (
            <Navigate to="/change-password" replace />
          ) : (
            <SuperAdminWrapper />
          )
        }
      />
      <Route
        path="/admin"
        element={
          !authUser ? (
            <Navigate to="/login" replace />
          ) : isSuspended ? (
            <Navigate to="/suspended" replace />
          ) : (
            <Navigate to="/admin/dashboard" replace />
          )
        }
      />

      {/* Root & Fallback */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
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

