import { useState } from 'react';
import { MOCK_ANNOUNCEMENTS } from '../constants/workspaceApp.constants';

const TYPE_CONFIG = {
  OUTAGE: { icon: 'gpp_maybe', badge: 'bg-error-bg text-error-text border-error-container', dot: 'bg-error-text' },
  MAINTENANCE: { icon: 'construction', badge: 'bg-warning-bg text-warning-text border-warning-bg', dot: 'bg-warning-text' },
  POLICY: { icon: 'policy', badge: 'bg-surface-container text-on-surface-variant border-border-subtle', dot: 'bg-outline' },
  ANNOUNCEMENT: { icon: 'campaign', badge: 'bg-success-bg text-success-text border-success-bg', dot: 'bg-success-text' },
};

export default function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkRead = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => a.id === id ? { ...a, isRead: true } : a)
    );
  };

  const handleAcknowledge = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => a.id === id ? { ...a, isAcknowledged: true, isRead: true } : a)
    );
    showToast('Acknowledgment recorded and signed electronically.');
  };

  const unreadCount = announcements.filter(a => !a.isRead).length;

  return (
    <div className="flex flex-col gap-xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-xl shadow-lg flex items-center gap-sm text-[13px] font-semibold animate-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-sm">
        <div>
          <h2 className="text-[22px] font-bold text-on-surface">Announcements</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Platform-wide broadcasts and compliance notices.</p>
        </div>
        {unreadCount > 0 && (
          <span className="px-sm py-1 bg-error-bg text-error-text text-[12px] font-bold rounded-full border border-error-container self-start sm:self-auto">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Announcements List */}
      <div className="flex flex-col gap-md">
        {announcements.map((ann) => {
          const typeConf = TYPE_CONFIG[ann.type] || TYPE_CONFIG.ANNOUNCEMENT;
          const isExpanded = expandedId === ann.id;

          return (
            <div
              key={ann.id}
              className={`bg-surface-container-lowest rounded-xl border shadow-xs overflow-hidden transition-shadow hover:shadow-md ${
                !ann.isRead ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border-subtle'
              }`}
            >
              {/* Card Header */}
              <div className="p-md flex items-start gap-sm">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${typeConf.badge}`}>
                  <span className="material-symbols-outlined text-[18px]">{typeConf.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-xs flex-wrap mb-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeConf.badge}`}>
                      {ann.typeLabel}
                    </span>
                    {!ann.isRead && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">New</span>
                    )}
                    {ann.requiresAck && !ann.isAcknowledged && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-bg text-warning-text border border-warning-bg">
                        Signature Required
                      </span>
                    )}
                    {ann.isAcknowledged && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success-text flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                        Acknowledged
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-on-surface text-[14px] leading-snug">{ann.title}</h3>
                  <div className="flex items-center gap-xs text-[11px] text-on-surface-variant mt-0.5">
                    <span>{ann.sentBy}</span>
                    <span>•</span>
                    <span>{new Date(ann.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="px-md pb-md">
                  <div className="bg-surface-container-low rounded-lg p-sm text-[13px] text-on-surface leading-relaxed">
                    {ann.body}
                  </div>
                  {ann.requiresAck && !ann.isAcknowledged && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(ann.id)}
                      className="mt-sm flex items-center gap-1.5 px-md py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:bg-on-primary-fixed transition-colors cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">draw</span>
                      I acknowledge and accept this policy
                    </button>
                  )}
                </div>
              )}

              {/* Footer / Expand Toggle */}
              <div className="px-md pb-md flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : ann.id);
                    if (!ann.isRead) handleMarkRead(ann.id);
                  }}
                  className="text-[12px] text-primary font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
                >
                  {isExpanded ? 'Collapse' : 'Read Full Announcement'}
                  <span className="material-symbols-outlined text-[15px]">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {!ann.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(ann.id)}
                    className="text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer font-medium"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
