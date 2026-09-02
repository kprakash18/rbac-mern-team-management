import LoginPage from '@/features/auth/pages/LoginPage';
import AcceptInvitationPage from './features/invitation/pages/AcceptInvitationPage';
import WorkspacePage from './features/workspaces/pages/WorkspacePage';

export default function App() {
  return(
    <>
      <LoginPage />
      <AcceptInvitationPage />
      <WorkspacePage />
    </>
  );
  
}
