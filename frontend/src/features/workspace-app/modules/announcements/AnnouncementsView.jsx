import AnnouncementsHeader from './components/AnnouncementsHeader';
import AnnouncementsList from './components/AnnouncementsList';
import AnnouncementsToast from './components/AnnouncementsToast';
import BroadcastModal from './components/BroadcastModal';
import { useAnnouncements } from './hooks/useAnnouncements';

export default function AnnouncementsView({
  currentUser,
  workspace,
  announcements = [],
  onAddAnnouncement,
  onMarkRead,
  onAcknowledge,
}) {
  const {
    canBroadcast,
    displayAnnouncements,
    expandedId,
    form,
    isBroadcastModalOpen,
    submitting,
    toast,
    unreadCount,
    handleOpenBroadcastModal,
    handleSubmitBroadcast,
    setExpandedId,
    setIsBroadcastModalOpen,
    updateForm,
  } = useAnnouncements({ announcements, currentUser, onAddAnnouncement, workspace });

  const handleToggleExpanded = (announcement) => {
    const isExpanded = expandedId === announcement.id;
    setExpandedId(isExpanded ? null : announcement.id);
    if (!announcement.isRead) onMarkRead?.(announcement.id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      <AnnouncementsToast toast={toast} />

      <AnnouncementsHeader
        canBroadcast={canBroadcast}
        unreadCount={unreadCount}
        onBroadcast={handleOpenBroadcastModal}
      />

      <AnnouncementsList
        announcements={displayAnnouncements}
        expandedId={expandedId}
        onAcknowledge={onAcknowledge}
        onMarkRead={onMarkRead}
        onToggleExpanded={handleToggleExpanded}
      />

      <BroadcastModal
        currentUser={currentUser}
        form={form}
        isOpen={isBroadcastModalOpen}
        submitting={submitting}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSubmit={handleSubmitBroadcast}
        updateForm={updateForm}
      />
    </div>
  );
}
