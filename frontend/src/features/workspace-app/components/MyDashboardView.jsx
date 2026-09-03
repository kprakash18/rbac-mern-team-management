import { useState, useEffect } from 'react';

export default function MyDashboardView({ currentUser, workspace, onNavigate }) {
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(6135); // 01h 42m 15s

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHeroCountdown = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}h ${m}m ${s}s`;
  };

  const formatCardCountdown = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const userName = currentUser?.name || 'Diana';
  const displayName = userName.includes(' ') ? userName.split(' ')[0] : userName;
  const userRole = currentUser?.role || 'Lead Architect';

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg">
      {/* Top search bar & buttons */}
      <div className="flex items-center justify-between pb-sm border-b border-border-subtle">
        <div className="flex items-center gap-md flex-1 max-w-md">
          <div className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface-variant w-full shadow-sm">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <input
              className="w-full bg-transparent font-body-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant"
              placeholder="Search permissions, teammates, audit events..."
              readOnly=""
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => onNavigate?.('jit-request')}
            className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-sm text-label-sm transition-opacity shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="">Request JIT Elevation</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('announcements')}
            className="relative p-1.5 rounded-lg border border-border-subtle text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error"></span>
          </button>
        </div>
      </div>

      {/* P0 Incident Alert Bar */}
      {!isAlertDismissed && (
        <div
          className="w-full rounded-lg bg-error-container/30 border border-error/20 px-md py-2.5 flex items-center justify-between gap-md transition-all duration-300"
          id="p0-alert-bar"
        >
          <div className="flex items-center gap-sm min-w-0">
            <span className="w-2 h-2 rounded-full bg-error animate-ping shrink-0"></span>
            <span className="font-label-bold text-label-bold text-error uppercase tracking-wider text-[11px] shrink-0">
              Active P0 Incident
            </span>
            <span className="text-on-surface-variant/70 text-body-sm truncate">
              Database Latency &amp; Read Degradation — Cluster failover ongoing in US-East-1
            </span>
          </div>
          <div className="flex items-center gap-sm shrink-0">
            <a
              className="inline-flex items-center gap-xs font-label-bold text-label-sm text-error hover:underline cursor-pointer"
              href="#bridge"
              onClick={(e) => {
                e.preventDefault();
                alert('Incident Bridge #infra-db-latency is active.');
              }}
            >
              <span className="">Incident Bridge</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
            <button
              type="button"
              className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              onClick={() => setIsAlertDismissed(true)}
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Welcome Card */}
      <div className="w-full rounded-xl bg-surface-container-lowest border border-border-subtle p-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <div className="flex items-center gap-sm flex-wrap">
            <h1 className="font-display-title text-[22px] font-semibold text-on-surface">
              Welcome back, {displayName}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              {userRole}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Prod-US-East cluster context • FIDO2 session active
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-warning-bg border border-warning-text/20 text-on-tertiary-fixed font-label-sm text-label-sm">
            <span className="w-2 h-2 rounded-full bg-warning-text animate-ping"></span>
            <span className="font-label-bold text-label-bold">DevSecOps Admin</span>
            <span className="text-on-surface-variant">
              (Expires in <span id="hero-countdown">{formatHeroCountdown(secondsRemaining)}</span>)
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div
          onClick={() => onNavigate?.('my-permissions')}
          className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Active Capabilities</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">key</span>
          </div>
          <div className="mt-sm">
            <div className="flex items-baseline gap-xs">
              <span className="font-headline-md text-[24px] font-semibold text-on-surface">18</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">/ 24 total</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">CI/CD, Vault, Telemetry</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('jit-request')}
          className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer hover:border-warning-text/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">JIT Elevation</span>
            <span className="material-symbols-outlined text-warning-text text-[18px]">timer</span>
          </div>
          <div className="mt-sm">
            <span className="font-headline-md text-[24px] font-semibold text-on-surface" id="card-countdown">
              {formatCardCountdown(secondsRemaining)}
            </span>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">INC-8492 • Re-indexing</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('team-members')}
          className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Team Presence</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">group</span>
          </div>
          <div className="mt-sm">
            <div className="flex items-baseline gap-xs">
              <span className="font-headline-md text-[24px] font-semibold text-on-surface">42</span>
              <span className="text-[12px] font-medium text-success-text">Online</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">5 on-call • 3 in bridge</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('announcements')}
          className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer hover:border-error/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">System Bulletins</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">campaign</span>
          </div>
          <div className="mt-sm">
            <div className="flex items-baseline gap-xs">
              <span className="font-headline-md text-[24px] font-semibold text-on-surface">2</span>
              <span className="text-[12px] text-warning-text font-medium">Action required</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">SOC2 Policy &amp; Kafka patch</p>
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Recent Activity */}
        <div className="lg:col-span-7 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm">
            <div className="flex items-center justify-between mb-md">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Recent Activity</h2>
                <p className="text-[12px] text-on-surface-variant">Workspace audit trail &amp; events</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('audit-log')}
                className="font-label-bold text-label-sm text-primary hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-border-subtle">
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-warning-bg text-on-tertiary-fixed flex items-center justify-center shrink-0 font-label-bold text-label-sm">
                  DM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface truncate">Diana Morales (You)</p>
                    <span className="text-[11px] text-on-surface-variant">18m ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">Elevated to DevSecOps Admin via Ticket #INC-8492</p>
                </div>
              </div>
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 font-label-bold text-label-sm">
                  CD
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface truncate">Charlie Davis</p>
                    <span className="text-[11px] text-on-surface-variant">34m ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">Provisioned bridge #infra-db-latency in Slack</p>
                </div>
              </div>
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 font-label-bold text-label-sm">
                  AJ
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface truncate">Alice Johnson</p>
                    <span className="text-[11px] text-on-surface-variant">1h ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">Deployed service-mesh-gateway v2.9.4 to Kubernetes</p>
                </div>
              </div>
              <div className="py-3 flex items-start gap-md">
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 font-label-bold text-label-sm">
                  ER
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-label-bold text-label-bold text-on-surface truncate">Elena Rostova</p>
                    <span className="text-[11px] text-on-surface-variant">2h ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">Signed Q4 Credential Rotation Disclosure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Workflows */}
        <div className="lg:col-span-5 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm">
            <div className="mb-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Quick Workflows</h2>
              <p className="text-[12px] text-on-surface-variant">Common privileged actions</p>
            </div>
            <div className="flex flex-col gap-sm">
              <div
                onClick={() => onNavigate?.('my-permissions')}
                className="p-md rounded-lg border border-border-subtle hover:border-outline transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface group-hover:text-primary transition-colors">
                      My RBAC Matrix
                    </p>
                    <p className="text-[11px] text-on-surface-variant">18 active capabilities verified</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="font-label-bold text-label-sm text-primary hover:underline cursor-pointer"
                >
                  Review
                </button>
              </div>

              <div className="p-md rounded-lg border border-error/20 bg-error-container/20 flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-9 h-9 rounded-lg bg-error text-on-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">groups</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface">Incident Bridge</p>
                    <p className="text-[11px] text-error font-medium">8 engineers on call now</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Joining Incident Bridge #infra-db-latency...')}
                  className="px-sm py-1 rounded bg-error text-on-error font-label-sm text-label-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Join
                </button>
              </div>

              <div className="p-md rounded-lg border border-border-subtle hover:border-outline transition-colors flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface">Policy Attestation</p>
                    <p className="text-[11px] text-on-surface-variant">Q4 SOC2 signature pending</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Opening Q4 SOC2 Attestation Disclosure...')}
                  className="px-sm py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  Sign
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
