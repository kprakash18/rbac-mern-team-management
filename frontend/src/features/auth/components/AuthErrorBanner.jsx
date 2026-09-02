export default function AuthErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="bg-error-container/30 border border-error-container rounded-md p-stack-sm mb-5 flex items-center gap-stack-sm text-error animate-in fade-in">
      <span className="material-symbols-outlined text-[18px]">error</span>
      <span className="font-label-md">{message}</span>
    </div>
  );
}
