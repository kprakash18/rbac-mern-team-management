import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';
import { useApp } from '@/context/useApp';

const TYPE_CONFIG = {
  OUTAGE: { icon: 'gpp_maybe', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'P0 Outage' },
  MAINTENANCE: { icon: 'construction', badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', label: 'Deployment & Maintenance' },
  POLICY: { icon: 'policy', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500', label: 'Security Policy' },
  ANNOUNCEMENT: { icon: 'campaign', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'General Notice' },
};

export default function AnnouncementsView({ currentUser, workspace, announcements = [], onAddAnnouncement, onMarkRead, onAcknowledge }) {
  const { activeWorkspace } = useApp();
  const teamId = workspace?._id || workspace?.id || activeWorkspace?._id || activeWorkspace?.id;
  const isTeamAdmin = currentUser?.isTeamAdmin ?? true;

  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [teamBroadcasts, setTeamBroadcasts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastType, setBroadcastType] = useState('MAINTENANCE');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [isSticky, setIsSticky] = useState(true);
  const [requiresAck, setRequiresAck] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBroadcasts = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await api.get(`/api/teams/${teamId}/broadcasts`);
      const raw = res.data?.data || [];
      const formatted = raw.map((b) => {
        const typeConf = TYPE_CONFIG[b.type] || TYPE_CONFIG.ANNOUNCEMENT;
        const senderName = b.senderId?.name || b.senderId?.email || 'Team Admin';
        return {
          id: b._id || b.id,
          _id: b._id || b.id,
          title: b.title,
          body: b.body || b.message,
          type: b.type || 'ANNOUNCEMENT',
          typeLabel: typeConf.label,
          severity: b.severity || (b.type === 'OUTAGE' ? 'CRITICAL' : 'INFO'),
          isActive: b.status === 'ACTIVE',
          isSticky: Boolean(b.isSticky),
          requiresAck: Boolean(b.requiresAck),
          sentAt: b.createdAt || new Date().toISOString(),
          sentBy: `${senderName} (Team Admin)`,
          isRead: false,
          isAcknowledged: false,
        };
      });
      setTeamBroadcasts(formatted);
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    }
  }, [teamId]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  // Real-time socket listener for team broadcasts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewBroadcast = () => {
      fetchBroadcasts();
    };

    socket.on('broadcast:new', handleNewBroadcast);
    socket.on('notification:new', handleNewBroadcast);

    return () => {
      socket.off('broadcast:new', handleNewBroadcast);
      socket.off('notification:new', handleNewBroadcast);
    };
  }, [fetchBroadcasts]);

  const handleOpenBroadcastModal = () => {
    setBroadcastTitle('');
    setBroadcastType('ANNOUNCEMENT');
    setBroadcastBody('');
    setIsSticky(false);
    setRequiresAck(false);
    setIsBroadcastModalOpen(true);
  };

  const handleSubmitBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      showToast('Please enter both a headline and message body.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (teamId) {
        const res = await api.post(`/api/teams/${teamId}/broadcasts`, {
          title: broadcastTitle.trim(),
          body: broadcastBody.trim(),
          type: broadcastType,
          isSticky,
          requiresAck,
        });

        const created = res.data?.data;
        const typeConf = TYPE_CONFIG[broadcastType] || TYPE_CONFIG.ANNOUNCEMENT;
        const formattedNew = {
          id: created?._id || `bc-${Date.now()}`,
          title: broadcastTitle.trim(),
          body: broadcastBody.trim(),
          type: broadcastType,
          typeLabel: typeConf.label,
          severity: broadcastType === 'OUTAGE' ? 'CRITICAL' : broadcastType === 'MAINTENANCE' ? 'WARNING' : 'INFO',
          isActive: true,
          isSticky,
          requiresAck,
          sentAt: new Date().toISOString(),
          sentBy: `${currentUser?.name || 'Admin'} (${currentUser?.teamRoleTitle || 'Team Admin'})`,
          isRead: false,
          isAcknowledged: false,
        };

        setTeamBroadcasts((prev) => [formattedNew, ...prev]);
        onAddAnnouncement?.(formattedNew);
      }
      setIsBroadcastModalOpen(false);
      showToast('📢 System broadcast dispatched to all team members!');
    } catch (err) {
      console.error('Failed to send broadcast:', err);
      showToast(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to dispatch broadcast.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayAnnouncements = teamBroadcasts.length > 0 ? teamBroadcasts : announcements;
  const unreadCount = displayAnnouncements.filter((a) => !a.isRead).length;

  return (
    <div className="w-full max-w-5xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg flex-1">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-md py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-[13px] font-semibold transition-all animate-in slide-in-from-top-4 duration-200 border ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'error' ? 'cancel' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
              System Bulletins &amp; Broadcasts
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Platform-wide alerts, deployment notices, and compliance bulletins
          </p>
        </div>

        {/* Broadcast Button (Team Admin) */}
        {isTeamAdmin ? (
          <button
            type="button"
            onClick={handleOpenBroadcastModal}
            className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-sm text-label-sm transition-opacity shadow-sm cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>+ Broadcast System Message</span>
          </button>
        ) : (
          <div
            className="flex items-center gap-xs px-md py-2 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm opacity-60 cursor-not-allowed border border-border-subtle select-none"
            title="Only Team Admins can broadcast system-level messages"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Broadcast (Admin Only)</span>
          </div>
        )}
      </div>

      {/* Announcements List */}
      <div className="flex flex-col gap-md">
        {displayAnnouncements.map((ann) => {
          const typeConf = TYPE_CONFIG[ann.type] || TYPE_CONFIG.ANNOUNCEMENT;
          const isExpanded = expandedId === ann.id;

          return (
            <div
              key={ann.id}
              className={`bg-surface-container-lowest rounded-xl border shadow-xs overflow-hidden transition-all ${
                !ann.isRead ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border-subtle'
              }`}
            >
              {/* Card Header */}
              <div className="p-md flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${typeConf.badge}`}>
                  <span className="material-symbols-outlined text-[20px]">{typeConf.icon}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeConf.badge}`}>
                      {ann.typeLabel}
                    </span>

                    {ann.isSticky && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">push_pin</span>
                        Pinned Banner
                      </span>
                    )}

                    {!ann.isRead && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">
                        NEW
                      </span>
                    )}

                    {ann.requiresAck && !ann.isAcknowledged && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Signature Required
                      </span>
                    )}

                    {ann.isAcknowledged && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                        Acknowledged
                      </span>
                    )}
                  </div>

                  <h3 className="font-label-bold text-on-surface text-[15px] leading-snug">
                    {ann.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1">
                    <span className="font-medium text-on-surface">{ann.sentBy}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(ann.sentAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="px-md pb-md">
                  <div className="bg-surface-container-low rounded-xl p-3.5 text-[13px] text-on-surface leading-relaxed border border-border-subtle/70">
                    {ann.body}
                  </div>

                  {ann.requiresAck && !ann.isAcknowledged && (
                    <button
                      type="button"
                      onClick={() => onAcknowledge?.(ann.id)}
                      className="mt-3 flex items-center gap-1.5 px-md py-2 rounded-lg bg-primary text-on-primary font-bold text-[13px] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">draw</span>
                      I acknowledge and accept this notice
                    </button>
                  )}
                </div>
              )}

              {/* Card Footer */}
              <div className="px-md pb-3 pt-1 border-t border-border-subtle/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : ann.id);
                    if (!ann.isRead) onMarkRead?.(ann.id);
                  }}
                  className="text-[12px] text-primary font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
                >
                  {isExpanded ? 'Collapse Notice' : 'Read Full Message'}
                  <span className="material-symbols-outlined text-[15px]">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {!ann.isRead && (
                  <button
                    type="button"
                    onClick={() => onMarkRead?.(ann.id)}
                    className="text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer font-medium"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {displayAnnouncements.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle">
            <span className="material-symbols-outlined text-[36px] block mb-1 text-on-surface-variant/50">
              campaign
            </span>
            <span className="font-semibold text-on-surface block">No system bulletins posted</span>
            <span className="text-[12px]">All active platform notices will appear here.</span>
          </div>
        )}
      </div>

      {/* Broadcast Modal (Team Admin On-The-Go Broadcast) */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-md border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[22px]">campaign</span>
                  <span>Broadcast System Message</span>
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  Instantly notify all team members across Acme Engineering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitBroadcast} className="p-md flex flex-col gap-3.5">
              {/* Category */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Broadcast Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBroadcastType(key)}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        broadcastType === key
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border-subtle bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">{val.icon}</span>
                      <span className="text-[11px] font-semibold text-on-surface truncate">{val.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Headline */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Message Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Today is deployment day — hope everyone is ready!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary font-medium"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="text-label-sm font-label-bold text-on-surface block mb-1">
                  Broadcast Details *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain what team members need to know or prepare for..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
                ></textarea>
              </div>

              {/* Toggles */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-[13px] font-semibold text-on-surface block">
                      Pin as Top Alert Banner
                    </span>
                    <span className="text-[11px] text-on-surface-variant block">
                      Displays a high-priority banner at the top of all team members' screens
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSticky}
                    onChange={(e) => setIsSticky(e.target.checked)}
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0 ml-3"
                  />
                </label>

                <div className="border-t border-border-subtle/60 pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-[13px] font-semibold text-on-surface block">
                        Require Teammate Acknowledgment
                      </span>
                      <span className="text-[11px] text-on-surface-variant block">
                        Members must electronically confirm receipt of this notice
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={requiresAck}
                      onChange={(e) => setRequiresAck(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0 ml-3"
                    />
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  Broadcasting as <strong>{currentUser?.name || 'Diana Morales'} (Team Admin)</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold transition-opacity shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Send to All Users</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
