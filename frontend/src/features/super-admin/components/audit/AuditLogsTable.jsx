import { AUDIT_SEVERITY } from '../../constants/audit.constants';

export default function AuditLogsTable({
  logs,
  onInspectLog,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-variant overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-surface-variant">
            <tr>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Timestamp</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Actor</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Action / Event</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Target</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Workspace</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Client IP</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant">Result</th>
              <th className="px-md py-sm font-label-bold text-label-bold text-on-surface-variant text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-2xl text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-xs">
                    <span className="material-symbols-outlined text-[40px] text-outline">policy</span>
                    <span className="font-label-bold text-on-surface">No security events found</span>
                    <span className="text-[12px]">No audit logs match your search and filter criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const severity = AUDIT_SEVERITY[log.severity] || AUDIT_SEVERITY.INFO;
                return (
                  <tr
                    key={log.id}
                    onClick={() => onInspectLog(log)}
                    className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer"
                  >
                    {/* Timestamp */}
                    <td className="px-md py-md whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-label-bold text-label-sm text-on-surface">
                          {log.timestamp.split('•')[0].trim()}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          {log.timestamp.split('•')[1]?.trim() || ''}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="px-md py-md whitespace-nowrap">
                      <div className="flex items-center gap-sm">
                        <div
                          className={`w-7 h-7 rounded-full ${log.actor.bgClass} flex items-center justify-center font-label-bold text-[11px] shrink-0`}
                        >
                          {log.actor.initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-bold text-label-sm text-on-surface truncate max-w-[130px]">
                            {log.actor.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant truncate max-w-[130px]">
                            {log.actor.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action & Severity Badge */}
                    <td className="px-md py-md whitespace-nowrap">
                      <div className="flex items-center gap-xs">
                        <span className={`w-2 h-2 rounded-full ${severity.dotClass} shrink-0`}></span>
                        <span className="font-label-bold text-label-sm text-on-surface">
                          {log.actionLabel || log.action}
                        </span>
                      </div>
                    </td>

                    {/* Target Identifier */}
                    <td className="px-md py-md whitespace-nowrap">
                      <span className="font-mono text-[12px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface">
                        {log.targetIdentifier || log.targetType}
                      </span>
                    </td>

                    {/* Workspace */}
                    <td className="px-md py-md whitespace-nowrap font-body-sm text-[12px] text-on-surface">
                      {log.workspace}
                    </td>

                    {/* Client IP */}
                    <td className="px-md py-md whitespace-nowrap font-mono text-[12px] text-on-surface-variant">
                      {log.ipAddress}
                    </td>

                    {/* Result */}
                    <td className="px-md py-md whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-bold text-[10px] tracking-wider uppercase border ${
                          log.result === 'SUCCESS'
                            ? 'bg-success-bg text-success-text border-success-bg'
                            : 'bg-error-bg text-error-text border-error-container animate-pulse'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-md py-md text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onInspectLog(log)}
                        className="px-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-label-bold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <span className="material-symbols-outlined text-[15px]">search</span>
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination / Count Footer */}
      <div className="px-md py-sm bg-surface-container-low border-t border-surface-variant flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>Showing {logs.length} recorded security events</span>
        <div className="flex items-center gap-xs">
          <span className="text-[11px] font-mono">SOC2 Type II Verified Log Stream</span>
        </div>
      </div>
    </div>
  );
}
