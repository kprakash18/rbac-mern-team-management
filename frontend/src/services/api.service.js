import api from "../api/axios";

// map _id → id
const mapData = (data) =>
  data.map(item => ({
    ...item,
    id: item._id
  }));

export const getTeams = async () => {
  const res = await api.get("/teams");
  return mapData(res.data);
};

export const getUsers = async (search = "") => {
  const res = await api.get(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  return mapData(res.data);
};

export const createUser = async (name, email) => {
  const res = await api.post("/users", { name, email });
  return res.data;
};

export const createTeam = async (name, teamId) => {
  const res = await api.post("/teams", { name, teamId });
  return res.data;
};

export const updateTeam = async (teamId, name) => {
  const res = await api.put(`/teams/${teamId}`, { name, teamId });
  return res.data;
};

export const deleteTeam = async (teamId) => {
  const res = await api.delete(`/teams/${teamId}`);
  return res.data;
};

export const getPermissions = async (userId, teamId) => {
  const res = await api.get(`/permission-service?userId=${userId}&teamId=${teamId}`);
  return res.data;
};

export const loginUser = async (email) => {
  const res = await api.post("/auth/login", { email });
  return res.data;
};

export const createTask = (data) => api.post("/tasks", data);

export const getTasks = (team) =>
  api.get(`/tasks?teamId=${team}`);

export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`);

