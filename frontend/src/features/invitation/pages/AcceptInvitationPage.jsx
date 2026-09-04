import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { INVITATION_STATES } from '@/constants';
import NewUserCard from '../components/NewUserCard';
import ExistingUserCard from '../components/ExistingUserCard';
import InvalidCard from '../components/InvalidCard';
import api from '@/lib/api';

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [viewState, setViewState] = useState(INVITATION_STATES.NEW_USER);
  const [invitationData, setInvitationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setViewState(INVITATION_STATES.INVALID_TOKEN);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/api/invitations/verify/${token}`);
        const data = res.data?.data;
        if (data) {
          setInvitationData({
            workspaceName: data.teamId?.name || data.team?.name || 'Workspace',
            role: data.roleId?.name || data.role?.name || 'Member',
            email: data.email || '',
            inviterName: data.invitedBy?.name || 'Team Admin',
          });
          setViewState(data.isExistingUser ? INVITATION_STATES.EXISTING_USER : INVITATION_STATES.NEW_USER);
        } else {
          setViewState(INVITATION_STATES.INVALID_TOKEN);
        }
      } catch (err) {
        console.warn('Invalid or expired invitation token:', err);
        setViewState(INVITATION_STATES.INVALID_TOKEN);
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleJoinNewUser = async (formData) => {
    try {
      setLoading(true);
      await api.post(`/api/invitations/accept/${token}`, {
        name: formData.fullName,
        password: formData.password,
      });
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptExisting = async () => {
    try {
      setLoading(true);
      await api.post(`/api/invitations/accept/${token}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineExisting = () => {
    navigate('/');
  };

  const handleGoToLogin = () => {
    navigate('/');
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20">
        <div className="h-16 max-w-7xl mx-auto px-container-margin flex items-center justify-between">
          <div className="flex items-center gap-stack-md">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/b2b_saas_logo.png"
            />
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
              Enterprise SaaS
            </span>
          </div>
          <div className="flex items-center gap-stack-md">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="flex-1 w-full flex flex-col justify-center items-center py-section-gap px-container-margin">
        {loading ? (
          <div className="p-xl text-center flex flex-col items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
            <span className="text-body-sm">Verifying invitation...</span>
          </div>
        ) : viewState === INVITATION_STATES.NEW_USER ? (
          <NewUserCard
            invitation={invitationData || {}}
            onJoin={handleJoinNewUser}
          />
        ) : viewState === INVITATION_STATES.EXISTING_USER ? (
          <ExistingUserCard
            invitation={invitationData || {}}
            onAccept={handleAcceptExisting}
            onDecline={handleDeclineExisting}
          />
        ) : (
          <InvalidCard onGoToLogin={handleGoToLogin} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-stack-lg border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-container-margin flex flex-col md:flex-row justify-between items-center gap-stack-md text-on-surface-variant font-label-sm text-label-sm">
          <span>© 2024 Enterprise SaaS. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
