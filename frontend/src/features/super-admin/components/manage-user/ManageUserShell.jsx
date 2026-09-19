function ManageUserShell({ children, onClose, user }) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-on-primary-fixed/40 backdrop-blur-sm p-md">
      <div className="w-full max-w-160 flex flex-col bg-surface-container-lowest rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-lg pb-md bg-surface-container-lowest shadow-sm z-10 relative border-b border-border-subtle">
          <h2 className="font-headline-md text-on-surface">Manage User: {user.name}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-surface-container transition-colors text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default ManageUserShell;
