function AccountStatusSection({ accountStatus, onStatusChange }) {
  return (
    <div className="flex flex-col gap-sm">
      <label className="font-label-bold text-on-surface">Account Status</label>
      <div className="relative w-full md:w-1/2">
        <select
          value={accountStatus}
          onChange={(event) => onStatusChange(event.target.value)}
          className="w-full appearance-none bg-surface-container text-on-surface font-body-base p-sm pr-xl rounded-lg outline-none focus:shadow-md transition-shadow shadow-sm cursor-pointer"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
          <option value="invited">Invited</option>
        </select>
        <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
}

export default AccountStatusSection;
