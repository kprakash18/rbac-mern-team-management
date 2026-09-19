import { TYPE_CONFIG } from '../announcementModel';

function BroadcastModal({
  currentUser,
  form,
  isOpen,
  submitting,
  onClose,
  onSubmit,
  updateForm,
}) {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-md flex flex-col gap-3.5">
          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">Broadcast Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateForm({ type: key })}
                  className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    form.type === key
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border-subtle bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">{value.icon}</span>
                  <span className="text-[11px] font-semibold text-on-surface truncate">{value.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">Message Headline *</label>
            <input
              type="text"
              required
              placeholder="e.g. Today is deployment day — hope everyone is ready!"
              value={form.title}
              onChange={(event) => updateForm({ title: event.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary font-medium"
            />
          </div>

          <div>
            <label className="text-label-sm font-label-bold text-on-surface block mb-1">Broadcast Details *</label>
            <textarea
              rows={4}
              required
              placeholder="Explain what team members need to know or prepare for..."
              value={form.body}
              onChange={(event) => updateForm({ body: event.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm text-on-surface outline-none focus:border-primary"
            ></textarea>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-[13px] font-semibold text-on-surface block">Pin as Top Alert Banner</span>
                <span className="text-[11px] text-on-surface-variant block">
                  Displays a high-priority banner at the top of all team members' screens
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.isSticky}
                onChange={(event) => updateForm({ isSticky: event.target.checked })}
                className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0 ml-3"
              />
            </label>

            <div className="border-t border-border-subtle/60 pt-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-[13px] font-semibold text-on-surface block">Require Teammate Acknowledgment</span>
                  <span className="text-[11px] text-on-surface-variant block">
                    Members must electronically confirm receipt of this notice
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.requiresAck}
                  onChange={(event) => updateForm({ requiresAck: event.target.checked })}
                  className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0 ml-3"
                />
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant">
              Broadcasting as <strong>{currentUser?.name || 'Diana Morales'} (Team Admin)</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-md py-1.5 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-md py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 text-label-sm font-label-bold transition-opacity shadow-sm cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">{submitting ? 'hourglass_top' : 'send'}</span>
                <span>{submitting ? 'Sending...' : 'Send to All Users'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BroadcastModal;
