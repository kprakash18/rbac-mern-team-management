export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center mb-5">
      <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-stack-md">
        <img
          alt="Company Logo"
          className="w-8 h-8 object-contain mix-blend-multiply"
          src="/b2b_saas_logo.png"
        />
      </div>
      <h1 className="text-[22px] font-semibold text-on-surface mb-stack-sm leading-tight tracking-tight">
        {title}
      </h1>
      <p className="font-body-md text-on-surface-variant">
        {subtitle}
      </p>
    </div>
  );
}
