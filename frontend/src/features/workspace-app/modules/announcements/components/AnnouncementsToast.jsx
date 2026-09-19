function AnnouncementsToast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-md py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-[13px] font-semibold transition-all animate-in slide-in-from-top-4 duration-200 border ${
        toast.type === 'error'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">
        {toast.type === 'error' ? 'cancel' : 'check_circle'}
      </span>
      {toast.msg}
    </div>
  );
}

export default AnnouncementsToast;
