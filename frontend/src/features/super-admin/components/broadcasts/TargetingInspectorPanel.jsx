import { BROADCAST_TYPES } from '../../constants/broadcasts.constants';

export default function TargetingInspectorPanel({
  selectedBroadcast,
  onOpenDetails,
  onOpenNewBroadcast,
}) {
  const currentBroadcast = selectedBroadcast;
  const typeConfig = currentBroadcast ? (BROADCAST_TYPES[currentBroadcast.type] || BROADCAST_TYPES.ANNOUNCEMENT) : BROADCAST_TYPES.OUTAGE;

  return (
    <div className="flex flex-col gap-lg">
      {/* Live Preview Container */}
      <div className="bg-surface-container-lowest rounded-xl p-lg shadow-sm flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">Targeting Inspector</h2>
          <span className="px-xs py-base rounded bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant">
            {currentBroadcast ? 'Inspecting Card' : 'Fleet Default'}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Simulate rendering for targeted workspaces and inspect live response metrics.
        </p>

        {/* Mock Device / End User View */}
        <div className="bg-surface-container-low rounded-xl p-md flex flex-col gap-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-xs">
              <span className="h-2 w-2 rounded-full bg-error-text"></span>
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">Client Header Mockup</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Viewport: 100%</span>
          </div>

          {/* Mini Sticky Banner Render */}
          {currentBroadcast ? (
            <div className={`${typeConfig.badgeClass} rounded-lg p-sm flex items-center justify-between gap-xs border`}>
              <div className="flex items-center gap-xs min-w-0">
                <span className="material-symbols-outlined text-[16px] shrink-0">{typeConfig.icon}</span>
                <span className="font-body-sm text-[12px] truncate font-medium">{currentBroadcast.title}</span>
              </div>
              <span className="font-label-sm text-[11px] underline shrink-0 cursor-pointer">
                {currentBroadcast.ackMode === 'MANDATORY_ACK' ? 'Sign' : 'Ack'}
              </span>
            </div>
          ) : (
            <div className="bg-error-container text-on-error-container rounded-lg p-sm flex items-center justify-between gap-xs">
              <div className="flex items-center gap-xs min-w-0">
                <span className="material-symbols-outlined text-[16px] text-error shrink-0">warning</span>
                <span className="font-body-sm text-body-sm truncate font-medium">CRITICAL: Us-East-1 Replica Outage</span>
              </div>
              <span className="font-label-sm text-label-sm underline shrink-0">Ack</span>
            </div>
          )}

          {/* Skeleton Mock Page Body */}
          <div className="bg-surface-container-lowest rounded-lg p-sm flex flex-col gap-xs">
            <div className="h-3 w-1/3 bg-surface-container-highest rounded"></div>
            <div className="h-2 w-full bg-surface-container rounded"></div>
            <div className="h-2 w-4/5 bg-surface-container rounded"></div>
          </div>
        </div>

        {/* Reach Breakdown by Workspace */}
        <div className="flex flex-col gap-md pt-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface">Fleet Penetration By Sector</span>
            <span className="font-label-sm text-label-sm text-success-text font-semibold">
              {currentBroadcast ? `${Math.round((currentBroadcast.metrics?.viewedCount / currentBroadcast.metrics?.targetedUsers) * 100)}% Reached` : '95.4% Combined'}
            </span>
          </div>

          {currentBroadcast?.workspaceBreakdown?.length > 0 ? (
            currentBroadcast.workspaceBreakdown.map((wb, idx) => {
              const pct = Math.round((wb.viewed / wb.targeted) * 100);
              return (
                <div key={idx} className="flex flex-col gap-base">
                  <div className="flex justify-between items-center font-body-sm text-body-sm">
                    <span className="text-on-surface font-medium truncate max-w-[160px]">{wb.workspace}</span>
                    <span className="text-on-surface-variant text-[11px]">{pct}% • {wb.viewed} / {wb.targeted}</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {/* Fallback Breakdown 1 */}
              <div className="flex flex-col gap-base">
                <div className="flex justify-between items-center font-body-sm text-body-sm">
                  <span className="text-on-surface font-medium">Engineering Core</span>
                  <span className="text-on-surface-variant">98.2% • 842 / 858</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '98.2%' }}></div>
                </div>
              </div>
              {/* Fallback Breakdown 2 */}
              <div className="flex flex-col gap-base">
                <div className="flex justify-between items-center font-body-sm text-body-sm">
                  <span className="text-on-surface font-medium">Operations &amp; SRE</span>
                  <span className="text-on-surface-variant">96.5% • 312 / 323</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '96.5%' }}></div>
                </div>
              </div>
              {/* Fallback Breakdown 3 */}
              <div className="flex flex-col gap-base">
                <div className="flex justify-between items-center font-body-sm text-body-sm">
                  <span className="text-on-surface font-medium">Finance &amp; Billing Admins</span>
                  <span className="text-on-surface-variant">91.0% • 110 / 121</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '91%' }}></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        {currentBroadcast && (
          <button
            type="button"
            onClick={() => onOpenDetails(currentBroadcast)}
            className="w-full py-xs px-md rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-bold text-label-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1 mt-xs"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            <span>Inspect Full Telemetry &amp; Acks</span>
          </button>
        )}

        {/* Quick Action Dispatch */}
        <div className="p-md rounded-lg bg-surface-container-high flex flex-col gap-sm mt-xs">
          <div className="flex items-center gap-xs text-on-surface">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span className="font-label-bold text-label-bold">High Priority Alert Bypass</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Emergency broadcasts bypass muted workspace preferences and trigger instantaneous web-socket pushes to all online agents.
          </p>
          <button
            type="button"
            onClick={onOpenNewBroadcast}
            className="w-full bg-surface-container-lowest hover:bg-surface-variant text-on-surface font-label-bold text-label-bold py-xs rounded-lg shadow-sm transition-colors text-center cursor-pointer"
          >
            Deploy Emergency Alert
          </button>
        </div>
      </div>

      {/* Quick Delivery Rules Info Card */}
      <div className="bg-surface-container-lowest rounded-xl p-lg shadow-sm flex flex-col gap-md">
        <div className="flex items-center gap-xs text-on-surface">
          <span className="material-symbols-outlined text-[20px]">tune</span>
          <h2 className="font-headline-md text-headline-md">Broadcast Guardrails</h2>
        </div>
        <ul className="flex flex-col gap-sm font-body-sm text-body-sm text-on-surface-variant">
          <li className="flex items-start gap-xs">
            <span className="material-symbols-outlined text-success-text text-[18px] shrink-0">check_circle</span>
            <span>Maximum 2 simultaneous sticky notices active per tenant</span>
          </li>
          <li className="flex items-start gap-xs">
            <span className="material-symbols-outlined text-success-text text-[18px] shrink-0">check_circle</span>
            <span>Cryptographic signoff logged for all SOC2 policy updates</span>
          </li>
          <li className="flex items-start gap-xs">
            <span className="material-symbols-outlined text-success-text text-[18px] shrink-0">check_circle</span>
            <span>Automated archival after 30 days of inactivity</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
