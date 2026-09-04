import { useState, useEffect, useRef, useCallback } from 'react';
import NotificationDropdown from '../../shell/NotificationDropdown';
import api from '@/lib/api';

export default function MyDashboardView({ currentUser, workspace, onNavigate }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    capabilitiesCount: 0,
    totalCapabilities: 0,
    activeJitCount: 0,
    activeMembersCount: 0,
    tasksCount: 0,
    completedTasksCount: 0,
  });
  const [activities, setActivities] = useState([]);

  const teamId = workspace?._id || workspace?.id;

  const fetchDashboardMetrics = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [membersRes, tasksRes, jitRes, auditRes, permsRes] = await Promise.allSettled([
        api.get(`/api/teams/${teamId}/members`),
        api.get(`/api/teams/${teamId}/tasks`),
        api.get(`/api/teams/${teamId}/access-requests`),
        api.get(`/api/teams/${teamId}/audit-logs`),
        api.get('/api/authorization/permissions'),
      ]);

      const members = membersRes.status === 'fulfilled' ? (membersRes.value.data?.data?.members || membersRes.value.data?.data || []) : [];
      const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data?.data?.tasks || tasksRes.value.data?.data || []) : [];
      const jitRequests = jitRes.status === 'fulfilled' ? (Array.isArray(jitRes.value.data?.data) ? jitRes.value.data.data : []) : [];
      const auditLogs = auditRes.status === 'fulfilled' ? (Array.isArray(auditRes.value.data?.data) ? auditRes.value.data.data : auditRes.value.data?.data?.logs || []) : [];
      const perms = permsRes.status === 'fulfilled' ? (permsRes.value.data?.data?.effectivePermissions || permsRes.value.data?.data || []) : [];

      const activeJits = jitRequests.filter((j) => j.status === 'APPROVED' || j.status === 'ACTIVE').length;
      const completedTasks = tasks.filter((t) => t.status === 'DONE').length;

      const formattedActivities = auditLogs.slice(0, 10).map((l) => {
        const actorName = l.actor?.name || l.actorId?.name || 'Teammate';
        const initials = actorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
        const timeStr = l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';
        return {
          id: l._id || l.id,
          actor: actorName,
          actorId: l.actorId?._id || l.actorId,
          initials,
          action: l.action || 'Performed action',
          time: timeStr,
          bgClass: 'bg-primary-container text-on-primary',
        };
      });

      setMetrics({
        capabilitiesCount: Array.isArray(perms) ? perms.length : 0,
        totalCapabilities: 35,
        activeJitCount: activeJits,
        activeMembersCount: Array.isArray(members) ? members.length : 0,
        tasksCount: Array.isArray(tasks) ? tasks.length : 0,
        completedTasksCount: completedTasks,
      });
      setActivities(formattedActivities);
    } catch (err) {
      console.warn('Failed to load workspace dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = currentUser?.name || 'Team Member';
  const displayName = userName.includes(' ') ? userName.split(' ')[0] : userName;
  const userRole = currentUser?.role || 'Member';
  const userEmail = currentUser?.email || '';
  const isTeamAdmin = currentUser?.isTeamAdmin;
  const teamRoleTitle = currentUser?.teamRoleTitle || (isTeamAdmin ? 'Team Admin' : 'Developer');
  const userInitials = (currentUser?.initials || userName.split(' ').map((n) => n[0]).join('').slice(0, 2)).toUpperCase() || 'TM';

  return (
    <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-lg flex flex-col gap-lg">
      {/* Top search bar & actions */}
      <div className="flex items-center justify-between pb-sm border-b border-border-subtle">
        <div className="flex items-center gap-md flex-1 max-w-md">
          <div className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-surface-container-lowest border border-border-subtle text-on-surface-variant w-full shadow-sm">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <input
              className="w-full bg-transparent font-body-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant"
              placeholder="Search tasks, teammates, capabilities..."
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
            <span>Request JIT Elevation</span>
          </button>
          <NotificationDropdown
            currentUser={currentUser}
            onSelectTab={onNavigate}
          />

          {/* Top-Right User Avatar & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-xs p-0.5 rounded-full border border-border-subtle hover:border-outline hover:bg-surface-container-low transition-colors cursor-pointer"
              title="Account & Profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-label-sm shrink-0">
                {userInitials}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-lowest border border-border-subtle shadow-xl py-2 z-50">
                <div className="px-md py-2 border-b border-border-subtle">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-label-bold text-on-surface truncate">{userName}</p>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        isTeamAdmin
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {teamRoleTitle}
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant truncate">{userEmail}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                    {userRole}
                  </span>
                </div>

                <div className="border-t border-border-subtle pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate?.('logout');
                    }}
                    className="w-full flex items-center gap-2 px-md py-2 text-[13px] text-error hover:bg-error-container/30 transition-colors cursor-pointer text-left font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="w-full rounded-xl bg-surface-container-lowest border border-border-subtle p-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <div className="flex items-center gap-sm flex-wrap">
            <h1 className="font-display-title text-[22px] font-semibold text-on-surface">
              Welcome back, {displayName}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              {teamRoleTitle}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Workspace: {workspace?.name || 'Active Team'} • Role-based access control active
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-xs px-md py-1.5 rounded-lg bg-surface-container border border-border-subtle text-on-surface font-label-sm text-label-sm">
            <span className="w-2 h-2 rounded-full bg-success-text"></span>
            <span className="font-label-bold">Session Active</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Card 1: Active Capabilities */}
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
              <span className="font-headline-md text-[24px] font-semibold text-on-surface">
                {metrics.capabilitiesCount}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                / {metrics.totalCapabilities} total
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">Granular RBAC privileges</p>
          </div>
        </div>

        {/* Card 2: Active JIT Leases */}
        <div
          onClick={() => onNavigate?.('jit-request')}
          className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer hover:border-warning-text/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Active JIT Grants</span>
            <span className="material-symbols-outlined text-warning-text text-[18px]">timer</span>
          </div>
          <div className="mt-sm">
            <span className="font-headline-md text-[24px] font-semibold text-on-surface">
              {metrics.activeJitCount}
            </span>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">
              {metrics.activeJitCount > 0 ? 'Elevated access active' : 'No active elevation leases'}
            </p>
          </div>
        </div>

        {/* Card 3: Team Members */}
        <div
          onClick={() => onNavigate?.('team-members')}
          className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Team Directory</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">group</span>
          </div>
          <div className="mt-sm">
            <div className="flex items-baseline gap-xs">
              <span className="font-headline-md text-[24px] font-semibold text-on-surface">
                {metrics.activeMembersCount}
              </span>
              <span className="text-[12px] font-medium text-success-text">Members</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">Workspace teammates</p>
          </div>
        </div>

        {/* Card 4: Tasks */}
        <div
          onClick={() => onNavigate?.('tasks')}
          className="p-md rounded-xl bg-surface-container-lowest border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Tasks Board</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">task</span>
          </div>
          <div className="mt-sm">
            <div className="flex items-baseline gap-xs">
              <span className="font-headline-md text-[24px] font-semibold text-on-surface">
                {metrics.tasksCount}
              </span>
              <span className="text-[12px] font-medium text-on-surface-variant">
                ({metrics.completedTasksCount} done)
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">Sprint delivery board</p>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Real Activity & Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Recent Activity */}
        <div className="lg:col-span-7 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm">
            <div className="flex items-center justify-between mb-md">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Recent Workspace Activity</h2>
                <p className="text-[12px] text-on-surface-variant">Live audit trail &amp; events</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('audit-log')}
                className="font-label-bold text-label-sm text-primary hover:underline cursor-pointer"
              >
                View Audit Log
              </button>
            </div>
            <div className="divide-y divide-border-subtle">
              {loading ? (
                <div className="py-8 text-center text-on-surface-variant text-body-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  <span>Loading recent activity...</span>
                </div>
              ) : activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="py-3 flex items-start gap-md">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-label-bold text-label-sm ${
                        act.bgClass || 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {act.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-label-bold text-label-bold text-on-surface truncate">{act.actor}</p>
                        <span className="text-[11px] text-on-surface-variant">{act.time}</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant truncate">{act.action}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-on-surface-variant text-body-sm flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[32px] text-outline">history</span>
                  <p className="font-medium text-on-surface">No recent workspace activity</p>
                  <p className="text-[12px] text-on-surface-variant">
                    Activity events and task updates will appear here in real time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Workflows */}
        <div className="lg:col-span-5 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-lg shadow-sm">
            <div className="mb-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Quick Workflows</h2>
              <p className="text-[12px] text-on-surface-variant">Common workspace actions</p>
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
                    <p className="text-[11px] text-on-surface-variant">{metrics.capabilitiesCount} active capabilities</p>
                  </div>
                </div>
                <span className="font-label-bold text-label-sm text-primary group-hover:underline">Review</span>
              </div>

              <div
                onClick={() => onNavigate?.('tasks')}
                className="p-md rounded-lg border border-border-subtle hover:border-outline transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface group-hover:text-primary transition-colors">
                      Manage Tasks
                    </p>
                    <p className="text-[11px] text-on-surface-variant">{metrics.tasksCount} total sprint items</p>
                  </div>
                </div>
                <span className="font-label-bold text-label-sm text-primary group-hover:underline">Open</span>
              </div>

              <div
                onClick={() => onNavigate?.('team-members')}
                className="p-md rounded-lg border border-border-subtle hover:border-outline transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                  </div>
                  <div>
                    <p className="font-label-bold text-label-bold text-on-surface">Team Directory</p>
                    <p className="text-[11px] text-on-surface-variant">{metrics.activeMembersCount} teammates enrolled</p>
                  </div>
                </div>
                <span className="font-label-bold text-label-sm text-on-surface-variant group-hover:underline">View</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
