export default function RoleMetricsGrid({ metrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
      <div className="stat-card">
        <span className="stat-label">Total Roles</span>
        <span className="stat-value text-on-surface">{metrics.total}</span>
        <span className="stat-subtext">Configured roles</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">System Roles</span>
        <span className="stat-value text-primary">{metrics.system}</span>
        <span className="stat-subtext">Immutable core</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Custom Roles</span>
        <span className="stat-value text-secondary">{metrics.custom}</span>
        <span className="stat-subtext">Bespoke assignments</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Active Members</span>
        <span className="stat-value text-success-text">{metrics.activeUsers}</span>
        <span className="stat-subtext">Assigned identities</span>
      </div>
      <div className="stat-card col-span-2 md:col-span-1">
        <span className="stat-label">Permissions Catalog</span>
        <span className="stat-value text-on-surface">{metrics.totalPerms}</span>
        <span className="stat-subtext">Granular action keys</span>
      </div>
    </div>
  );
}
