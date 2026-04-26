import { useEffect, useState } from "react";
import { hasPermission } from "../utils/permissions";

const TeamActions = ({
  selectedTeam,
  permissions = [],
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onRefresh
}) => {
  const [createName, setCreateName] = useState("");
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canCreate = hasPermission(permissions, ["createTeam"]);
  const canEdit = hasPermission(permissions, ["editTeam"]);
  const canDelete = hasPermission(permissions, ["deleteTeam"]);

  useEffect(() => {
    setEditName(selectedTeam?.name || "");
  }, [selectedTeam]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!selectedTeam) {
      setError("Select a team first");
      setLoading(false);
      return;
    }

    try {
      await onCreateTeam(createName, selectedTeam.id);
      setCreateName("");
      setMessage("Team created successfully.");
      await onRefresh();
    } catch (createError) {
      setError(createError.response?.data?.error || "Unable to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTeam) {
      setError("Select a team first");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await onUpdateTeam(selectedTeam.id, editName);
      setMessage("Team updated successfully.");
      await onRefresh();
    } catch (updateError) {
      setError(updateError.response?.data?.error || "Unable to update team");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeam) {
      setError("Select a team first");
      return;
    }

    if (!window.confirm(`Delete ${selectedTeam.name}?`)) {
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await onDeleteTeam(selectedTeam.id);
      setMessage("Team deleted successfully.");
      setEditName("");
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || "Unable to delete team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Team Actions</h3>
      <p className="empty">Create, edit, and delete are shown only when the token grants access.</p>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {canCreate && (
        <form className="action-form" onSubmit={handleCreate}>
          <input
            placeholder="New team name"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            disabled={!selectedTeam}
          />
          <button type="submit" disabled={loading || !createName.trim() || !selectedTeam}>
            Create
          </button>
        </form>
      )}

      {canEdit && (
        <div className="action-form">
          <input
            placeholder="Selected team name"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            disabled={!selectedTeam}
          />
          <button type="button" onClick={handleUpdate} disabled={loading || !selectedTeam}>
            Edit
          </button>
        </div>
      )}

      {canDelete && (
        <div className="action-form">
          <button type="button" className="danger" onClick={handleDelete} disabled={loading || !selectedTeam}>
            Delete
          </button>
        </div>
      )}

      {!canCreate && !canEdit && !canDelete && <p className="empty">No actions available.</p>}
    </div>
  );
};

export default TeamActions;
