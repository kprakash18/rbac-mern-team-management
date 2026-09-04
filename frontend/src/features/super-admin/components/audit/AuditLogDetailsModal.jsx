import { useState } from 'react';
import { AUDIT_SEVERITY } from '@/constants';

export default function AuditLogDetailsModal({
  isOpen,
  log,
  onClose,
}) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !log) return null;

  const severityConfig = AUDIT_SEVERITY[log.severity] || AUDIT_SEVERITY.INFO;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-md" id="modal-audit-details">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Centered Modal Card */}
      <div
        className="relative bg-card-bg w-[680px] max-w-[94vw] max-h-[92vh] rounded-xl shadow-2xl overflow-hidden border border-border-subtle z-[1110] animate-in zoom-in-95 duration-150 flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm min-w-0 flex-1 pr-sm">
            <span className={`p-2 rounded-lg shrink-0 border ${severityConfig.badgeClass}`}>
              <span className="material-symbols-outlined text-[20px]">{severityConfig.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-xs mb-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${severityConfig.badgeClass}`}>
                  {log.severity}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    log.result === 'SUCCESS'
                      ? 'bg-success-bg text-success-text border-success-bg'
                      : 'bg-error-bg text-error-text border-error-container'
                  }`}
                >
                  {log.result}
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">#{log.id}</span>
              </div>
              <h3 className="font-headline-md text-[17px] font-bold text-on-surface leading-tight">
                {log.actionLabel || log.action}
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

        {/* Modal Body */}
        <div className="p-lg space-y-md overflow-y-auto flex-1 text-body-sm">
          {/* Actor & Execution Context Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            {/* Actor Card */}
            <div className="p-sm bg-surface-container-low rounded-xl border border-border-subtle flex flex-col gap-xs">
              <span className="text-[11px] font-label-bold text-on-surface-variant uppercase tracking-wider">
                Initiating Actor
              </span>
              <div className="flex items-center gap-sm mt-1">
                <div
                  className={`w-9 h-9 rounded-full ${log.actor.bgClass} flex items-center justify-center font-bold text-[13px] shrink-0`}
                >
                  {log.actor.initials}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-on-surface text-[13px] block truncate">{log.actor.name}</span>
                  <span className="text-on-surface-variant text-[11px] block truncate">{log.actor.email}</span>
                </div>
              </div>
              <div className="mt-xs pt-xs border-t border-border-subtle flex justify-between text-[11px]">
                <span className="text-on-surface-variant">Role Tier:</span>
                <span className="font-semibold text-on-surface">{log.actor.role}</span>
              </div>
            </div>

            {/* Network & Client Telemetry */}
            <div className="p-sm bg-surface-container-low rounded-xl border border-border-subtle flex flex-col gap-xs">
              <span className="text-[11px] font-label-bold text-on-surface-variant uppercase tracking-wider">
                Network &amp; Client Telemetry
              </span>
              <div className="space-y-1.5 mt-1 text-[12px]">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-[11px]">IP Address:</span>
                  <span className="font-mono font-bold text-on-surface bg-surface-container px-1.5 py-0.5 rounded text-[11px]">
                    {log.ipAddress}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-[11px]">Workspace:</span>
                  <span className="font-semibold text-on-surface text-[11px]">{log.workspace}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-[11px]">Timestamp:</span>
                  <span className="text-on-surface text-[11px]">{log.timestamp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Agent String */}
          <div className="p-sm bg-surface-container-low rounded-xl border border-border-subtle">
            <span className="text-[11px] font-label-bold text-on-surface-variant block mb-1 uppercase tracking-wider">
              Client User-Agent Fingerprint
            </span>
            <code className="text-[11px] text-on-surface font-mono break-all block leading-relaxed">
              {log.userAgent}
            </code>
          </div>

          {/* Raw JSON Metadata Payload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-label-bold text-on-surface-variant uppercase tracking-wider">
                Structured Metadata Payload (State Diff)
              </span>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="px-sm py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-border-subtle"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isCopied ? 'check' : 'content_copy'}
                </span>
                <span>{isCopied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
            <div className="bg-slate-950 text-slate-100 p-md rounded-xl font-mono text-[12px] overflow-x-auto max-h-56 border border-slate-800 leading-relaxed shadow-inner">
              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
            </div>
          </div>
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
          <button
            type="button"
            onClick={handleCopyJSON}
            className="h-9 px-lg rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed font-label-bold text-label-sm transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copy Full Audit Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
