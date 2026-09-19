function CreateUserIdentitySection({
  email,
  fullName,
  isExistingUser,
  onEmailChange,
  onFullNameChange,
}) {
  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <h3 className="font-label-bold text-label-bold uppercase tracking-wider text-[11px] text-on-surface-variant">
          User Identity Details
        </h3>
        {isExistingUser ? (
          <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-label-sm text-[10px] flex items-center gap-1 shadow-sm font-semibold">
            <span className="material-symbols-outlined text-[12px]">how_to_reg</span> Existing User — Will add cross-workspace access
          </span>
        ) : (
          <span className="bg-success-bg text-success-text px-2 py-0.5 rounded-full font-label-sm text-[10px] flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">check_circle</span> New User Available
          </span>
        )}
      </div>
      <div className="flex flex-col gap-sm">
        <label className="font-label-sm text-label-sm text-on-surface-variant">Full Name</label>
        <input
          value={fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
          className="w-full h-10 px-sm bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="e.g. Alice Vance"
          type="text"
        />
      </div>
      <div className="flex flex-col gap-sm">
        <label className="font-label-sm text-label-sm text-on-surface-variant">Email Address</label>
        <input
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="w-full h-10 px-sm bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="e.g. user@company.com"
          type="email"
        />
      </div>
    </div>
  );
}

export default CreateUserIdentitySection;
