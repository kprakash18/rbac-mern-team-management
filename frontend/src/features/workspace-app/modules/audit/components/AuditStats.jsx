function StatCard({ label, value, className = 'text-on-surface' }) {
  return (
    <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-subtle flex flex-col">
      <span className="text-[11px] font-semibold text-on-surface-variant">{label}</span>
      <span className={`text-[22px] font-bold mt-0.5 ${className}`}>{value}</span>
    </div>
  );
}

function AuditStats({ logs }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Total Logged Events" value={logs.length} />
      <StatCard label="JIT Privilege Grants" value={logs.filter((log) => log.category === 'JIT_ELEVATION').length} className="text-amber-700" />
      <StatCard label="Role & Member Edits" value={logs.filter((log) => log.category === 'ROLE_MANAGEMENT' || log.category === 'MEMBERSHIP').length} className="text-purple-700" />
      <StatCard label="Security Alerts" value={logs.filter((log) => log.severity === 'CRITICAL').length} className="text-red-700" />
    </div>
  );
}

export default AuditStats;
