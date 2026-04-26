import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeamSelector from "../components/TeamSelector";
import PermissionList from "../components/PermissionList";
import TeamActions from "../components/TeamActions";
import UserSelector from "../components/UserSelector";
import { createTeam, deleteTeam, getPermissions, getTeams, getUsers, updateTeam } from "../services/api.service";
import { removeStoredToken } from "../utils/auth";
import TaskManager from "../components/TaskManager";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === teamId) || null,
    [teams, teamId]
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === userId) || null,
    [users, userId]
  );

  const refreshTeams = async () => {
    const data = await getTeams();
    setTeams(data);

    if (teamId && !data.some((team) => team.id === teamId)) {
      setTeamId("");
      setPermissions([]);
    }
  };

  const refreshUsers = async () => {
    const data = await getUsers();
    setUsers(data);

    if (userId && !data.some((user) => user.id === userId)) {
      setUserId("");
      setPermissions([]);
    }
  };

  useEffect(() => {
    refreshTeams();
    refreshUsers();
  }, []);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!teamId || !userId) {
        setPermissions([]);
        return;
      }

      setLoading(true);
    try {
        const data = await getPermissions(userId, teamId);
        setPermissions(data);
        setError("");
    } catch (err) {
    setPermissions([]);
    setError("Failed to load permissions");
    } finally {
        setLoading(false);
      }
};

    loadPermissions();
  }, [teamId, userId]);

 return (
  <div className="app">
    {/* Sidebar */}
    <aside className="sidebar">
      <h2>RBAC</h2>
      <button
        onClick={() => {
          removeStoredToken();
          navigate("/login");
        }}
      >
        Logout
      </button>
    </aside>

    {/* Main Content */}
    <main className="main">
      <div className="header">
        <h1>Dashboard</h1>
        <p>Manage teams, permissions and tasks</p>
      </div>

      <div className="grid">
        <div className="card">
          <UserSelector users={users} userId={userId} setUser={setUserId} />
        </div>

        <div className="card">
          <TeamSelector
            teams={teams}
            teamId={teamId}
            setTeam={setTeamId}
          />
        </div>

        <div className="card">
          <PermissionList
            permissions={permissions}
            loading={loading}
            error={error}
            selectedUser={selectedUser}
            selectedTeam={selectedTeam}
          />
        </div>

        <div className="card">
          <TeamActions
            selectedTeam={selectedTeam}
            permissions={permissions}
            onCreateTeam={createTeam}
            onUpdateTeam={updateTeam}
            onDeleteTeam={deleteTeam}
            onRefresh={refreshTeams}
          />
        </div>

        {teamId && (
          <TaskManager team={teamId} perms={permissions} />
        )}
      </div>
    </main>
  </div>
);
};

export default Dashboard;
