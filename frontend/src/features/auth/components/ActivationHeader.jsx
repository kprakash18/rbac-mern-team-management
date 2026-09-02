export default function ActivationHeader() {
  return (
    <div className="flex flex-col items-center mb-stack-lg">
      <div
        className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-stack-md"
        style={{ backgroundColor: 'rgb(241, 245, 249)' }}
      >
        <img
          alt="Company Logo"
          className="w-8 h-8 object-contain mix-blend-multiply"
          src="/b2b_saas_logo.png"
        />
      </div>
      <h2
        className="font-headline-sm text-headline-sm text-on-surface mb-unit text-center"
        style={{
          color: 'rgb(15, 23, 42)',
          lineHeight: 1.4,
          letterSpacing: '-0.01em',
        }}
      >
        Secure your account
      </h2>
      <p
        className="font-body-md text-body-md text-on-surface-variant text-center max-w-[320px]"
        style={{ color: 'rgb(71, 85, 105)', lineHeight: 1.6 }}
      >
        Please set a new password to replace your temporary one.
      </p>
    </div>
  );
}
