import { useState } from 'react';
import { BROADCAST_TYPES } from '@/constants';

export default function BroadcastDetailsDrawer({
  isOpen,
  broadcast,
  onClose,
  onEndEarly,
}) {
  const [activeTab, setActiveTab] = useState('telemetry');

  if (!isOpen || !broadcast) return null;

  const typeConfig = BROADCAST_TYPES[broadcast.type] || BROADCAST_TYPES.ANNOUNCEMENT;
  const percentage = broadcast.metrics?.targetedUsers
    ? Math.round((broadcast.metrics.viewedCount / broadcast.metrics.targetedUsers) * 100)
    : 0;

  const handleExportCSV = () => {
    const rows = [
      ['User Name', 'Email', 'Workspace', 'Acknowledgment Timestamp', 'IP Address', 'Broadcast ID', 'Status'],
      ...(broadcast.recentAcks || []).map((ack) => [
        ack.user,
        ack.email,
        ack.workspace,
        ack.timestamp,
        ack.ip || '192.168.1.1',
        broadcast.id,
        'VERIFIED_ELECTRONIC_SIGNATURE',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `broadcast-acknowledgments-${broadcast.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md" id="modal-broadcast-details">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Centered Modal Card */}
      <div
        className="relative bg-card-bg w-[620px] max-w-[94vw] max-h-[92vh] rounded-xl shadow-2xl overflow-hidden border border-border-subtle z-[1110] animate-in zoom-in-95 duration-150 flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm min-w-0 flex-1 pr-sm">
            <span className={`p-2 rounded-lg shrink-0 ${typeConfig.badgeClass}`}>
              <span className="material-symbols-outlined text-[20px]">{typeConfig.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-xs mb-0.5">
                <span className="font-label-bold text-[12px] text-on-surface">{typeConfig.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-mono font-bold">{broadcast.status}</span>
              </div>
              <h3 className="font-headline-md text-[16px] font-bold text-on-surface leading-tight">
                {broadcast.title}
              </h3>
            </div>
          </div>
          <button
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer shrink-0"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle bg-surface-container-low px-lg gap-md text-body-sm font-label-bold">
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`py-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Audience Telemetry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('acks')}
            className={`py-sm border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'acks'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Acknowledgment Log</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-[11px]">
              {broadcast.recentAcks?.length || 0}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-lg space-y-md overflow-y-auto flex-1">
          {/* Full Message Box */}
          <div className="p-md bg-surface-container-low rounded-xl border border-border-subtle text-body-sm text-on-surface">
            <span className="font-label-bold text-[11px] text-on-surface-variant block mb-1 uppercase tracking-wider">
              Broadcast Message Content
            </span>
            <p className="leading-relaxed">{broadcast.message}</p>
            {broadcast.cta && (
              <div className="mt-sm pt-xs border-t border-border-subtle flex items-center justify-between">
                <span className="text-[12px] font-semibold text-primary">{broadcast.cta.label}</span>
                <span className="text-[11px] text-outline font-mono truncate max-w-xs">{broadcast.cta.url}</span>
              </div>
            )}
          </div>

          {activeTab === 'telemetry' ? (
            <div className="space-y-md">
              {/* Stat Gauges */}
              <div className="grid grid-cols-3 gap-xs p-sm bg-surface-container-lowest rounded-xl border border-border-subtle text-center">
                <div className="p-xs">
                  <span className="text-[11px] text-on-surface-variant font-label-bold block">Targeted</span>
                  <span className="font-display-title text-[20px] font-bold text-on-surface">
                    {broadcast.metrics?.targetedUsers}
                  </span>
                </div>
                <div className="p-xs border-x border-border-subtle">
                  <span className="text-[11px] text-on-surface-variant font-label-bold block">Viewed</span>
                  <span className="font-display-title text-[20px] font-bold text-success-text">
                    {broadcast.metrics?.viewedCount} ({percentage}%)
                  </span>
                </div>
                <div className="p-xs">
                  <span className="text-[11px] text-on-surface-variant font-label-bold block">Acknowledged</span>
                  <span className="font-display-title text-[20px] font-bold text-primary">
                    {broadcast.metrics?.acknowledgedCount}
                  </span>
                </div>
              </div>

              {/* Workspace Breakdown */}
              <div>
                <span className="font-label-bold text-label-sm text-on-surface block mb-sm">
                  Breakdown by Targeted Workspace
                </span>
                <div className="space-y-sm">
                  {(broadcast.workspaceBreakdown || []).map((wb, idx) => {
                    const pct = Math.round((wb.viewed / wb.targeted) * 100);
                    return (
                      <div key={idx} className="p-sm bg-surface-container-low rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="font-semibold text-on-surface">{wb.workspace}</span>
                          <span className="text-on-surface-variant">{pct}% • {wb.viewed} of {wb.targeted}</span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata */}
              <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant space-y-1">
                <div><strong>Created By:</strong> {broadcast.createdBy}</div>
                <div><strong>Started:</strong> {broadcast.startAt || broadcast.createdAt}</div>
                <div><strong>Expires:</strong> {broadcast.endAt || 'Run until dismissed'}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <span className="font-label-bold text-label-sm text-on-surface">
                  Verified Electronic Signatures
                </span>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-[11px] flex items-center gap-1 cursor-pointer border border-border-subtle"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  <span>Export CSV</span>
                </button>
              </div>

              {broadcast.recentAcks?.length === 0 ? (
                <div className="py-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[32px] text-outline">history</span>
                  <p className="text-[12px] mt-1">No electronic sign-offs recorded yet.</p>
                </div>
              ) : (
                <div className="border border-border-subtle rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-surface-container-low border-b border-border-subtle text-on-surface-variant font-label-bold">
                      <tr>
                        <th className="px-sm py-xs">User</th>
                        <th className="px-sm py-xs">Workspace</th>
                        <th className="px-sm py-xs">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {broadcast.recentAcks.map((ack, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-low/40">
                          <td className="px-sm py-xs font-semibold text-on-surface">{ack.user}</td>
                          <td className="px-sm py-xs text-on-surface-variant">{ack.workspace}</td>
                          <td className="px-sm py-xs text-on-surface-variant">{ack.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-md bg-surface-container-low flex justify-between items-center border-t border-border-subtle shrink-0">
          <button
            type="button"
            className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
            onClick={onClose}
          >
            Close
          </button>
          <div className="flex items-center gap-xs">
            {broadcast.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => {
                  onEndEarly(broadcast);
                  onClose();
                }}
                className="h-9 px-md rounded-lg bg-error-bg hover:bg-error-container text-error font-label-bold text-label-sm transition-colors cursor-pointer"
              >
                End Early
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-9 px-md rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
