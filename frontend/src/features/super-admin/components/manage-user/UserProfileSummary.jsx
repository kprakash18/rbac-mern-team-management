const STATUS_STYLES = {
  active: 'bg-success-bg text-success-text',
  disabled: 'bg-surface-container-high text-on-surface-variant',
  invited: 'bg-warning-bg text-warning-text',
  suspended: 'bg-error-bg text-error-text',
};

function UserProfileSummary({ accountStatus, isSuperAdmin, user }) {
  return (
    <div className="flex items-center gap-md bg-surface-container-low p-md rounded-lg shadow-sm">
      {user.avatar ? (
        <img
          className="w-12 h-12 rounded-full object-cover shadow-sm"
          src={user.avatar}
          alt={user.name}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary font-label-bold flex items-center justify-center text-label-bold shadow-sm">
          {user.initials}
        </div>
      )}
      <div className="flex flex-col flex-1 gap-base">
        <div className="flex items-center gap-xs">
          <span className="font-label-bold text-on-surface">{user.name}</span>
          {isSuperAdmin && (
            <span className="material-symbols-outlined text-warning-text text-[16px]" title="Platform Super Admin">
              local_police
            </span>
          )}
        </div>
        <span className="font-body-sm text-on-surface-variant">{user.email}</span>
      </div>
      <span className={`px-sm py-base font-label-bold rounded-full text-center text-[12px] ${STATUS_STYLES[accountStatus] || STATUS_STYLES.active}`}>
        {accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
      </span>
    </div>
  );
}

export default UserProfileSummary;
