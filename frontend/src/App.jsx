import LoginPage from '@/features/auth/pages/LoginPage';
import ActivateAccountPage from './features/auth/pages/ActivateAccountPage';
import AcceptInvitationPage from './features/invitation/pages/AcceptInvitationPage';
import WorkspacePage from './features/workspaces/pages/WorkspacePage';

export default function App() {
  return(
    <>
      <LoginPage />
      <ActivateAccountPage />
      <AcceptInvitationPage />
      <WorkspacePage />
    </>
  );
  
}
