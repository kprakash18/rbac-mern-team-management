function DetailTile({ label, children }) {
  return (
    <div className="p-2.5 rounded-lg border border-border-subtle bg-surface-container-lowest">
      <span className="text-on-surface-variant block text-[10px] uppercase font-bold">{label}</span>
      <span className="font-semibold text-on-surface">{children}</span>
    </div>
  );
}

function AuditEventDetailsModal({ event, onClose }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-lg pb-md border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Audit Event Details</h3>
              <span className="font-mono text-[11px] text-on-surface-variant block">{event.id}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-lg overflow-y-auto flex flex-col gap-md">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
              <span className="font-label-bold text-label-sm text-on-surface">Cryptographic Verification: VALID</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">{event.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <DetailTile label="Action Type"><span className="font-mono">{event.action}</span></DetailTile>
            <DetailTile label="Category">{event.category}</DetailTile>
            <DetailTile label="Actor Name">{event.actor.name}</DetailTile>
            <DetailTile label="Actor Email"><span className="font-mono">{event.actor.email}</span></DetailTile>
            <DetailTile label="Target Resource"><span className="font-mono">{event.resource}</span></DetailTile>
            <DetailTile label="Source IP"><span className="font-mono">{event.ipAddress}</span></DetailTile>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-on-surface uppercase">Event Narrative</span>
            <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle text-[13px] text-on-surface leading-relaxed">{event.details}</div>
          </div>
        </div>
        <div className="p-md border-t border-border-subtle bg-surface-container-low flex justify-end">
          <button type="button" onClick={onClose} className="px-md py-2 rounded-lg bg-primary text-on-primary font-label-bold text-label-sm hover:opacity-90 transition-opacity cursor-pointer">
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuditEventDetailsModal;
