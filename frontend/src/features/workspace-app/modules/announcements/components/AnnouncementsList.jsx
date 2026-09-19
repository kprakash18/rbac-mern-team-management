import AnnouncementCard from './AnnouncementCard';

function EmptyAnnouncements() {
  return (
    <div className="py-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle">
      <span className="material-symbols-outlined text-[36px] block mb-1 text-on-surface-variant/50">campaign</span>
      <span className="font-semibold text-on-surface block">No system bulletins posted</span>
      <span className="text-[12px]">All active platform notices will appear here.</span>
    </div>
  );
}

function AnnouncementsList({
  announcements,
  expandedId,
  onAcknowledge,
  onMarkRead,
  onToggleExpanded,
}) {
  if (announcements.length === 0) return <EmptyAnnouncements />;

  return (
    <div className="flex flex-col gap-md">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          isExpanded={expandedId === announcement.id}
          onAcknowledge={onAcknowledge}
          onMarkRead={onMarkRead}
          onToggle={onToggleExpanded}
        />
      ))}
    </div>
  );
}

export default AnnouncementsList;
