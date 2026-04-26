const normalizePermission = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const hasPermission = (permissions, candidates) => {
  const normalizedPermissions = permissions.map((permission) =>
    normalizePermission(permission.name || permission)
  );

  return candidates.some((candidate) =>
    normalizedPermissions.includes(normalizePermission(candidate))
  );
};

const PermissionList = ({ permissions = [], loading = false, error = "", selectedUser, selectedTeam }) => {
  const canCreate = hasPermission(permissions, ["CREATE_TASK", "createTask", "create_task"]);
  const canEdit = hasPermission(permissions, ["EDIT_TASK", "editTask", "edit_task"]);
  const canDelete = hasPermission(permissions, ["DELETE_TASK", "deleteTask", "delete_task"]);

 return (
  <div>
    <h3>Permissions</h3>

    {selectedUser && selectedTeam && (
      <p className="empty">
        Showing permissions for <strong>{selectedUser.name}</strong> in <strong>{selectedTeam.name}</strong>
      </p>
    )}

    {loading && <p className="loading">Loading permissions...</p>}

    {error && <p className="error">{error}</p>}

    {!loading && !permissions.length && (
      <p className="empty">No permissions</p>
    )}

    <div className="permission-list">
      {permissions.map((p, i) => (
        <div className="permission-item" key={i}>
          {p.name || p}
        </div>
      ))}
    </div>
  </div>
);
};

export default PermissionList;
