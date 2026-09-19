function CreateUserModalFrame({ children, footer, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-145 bg-surface-container-lowest rounded-xl shadow-xl border border-border-subtle flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-lg border-b border-border-subtle">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface m-0">Create &amp; Invite User to Platform</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-lg overflow-y-auto flex flex-col gap-xl">{children}</div>
        {footer}
      </div>
    </div>
  );
}

export default CreateUserModalFrame;
