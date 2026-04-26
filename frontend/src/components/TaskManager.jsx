import { useEffect, useState } from "react";
import { getTasks, createTask, deleteTask } from "../services/api.service";

const TaskManager = ({ team, perms }) => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const permNames = perms.map(p => p.name || p);

    const loadTasks = async () => {
    if (!team) return;

    setLoading(true);
    try {
        const res = await getTasks(team);
        setTasks(res.data);
        setError("");
    } catch {
        setError("Failed to load tasks");
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    loadTasks();
  }, [team]);

  const handleCreate = async () => {
  try {
        await createTask({ title, teamId: team });
        setTitle("");
        loadTasks();
    } catch {
        setError("Failed to create task");
    }
   };      

  const handleDelete = async (id) => {
  try {
    await deleteTask(id);
    loadTasks();
  } catch {
    setError("Failed to delete task");
  }
};

 return (
  <div className="card">
    <h3>Tasks</h3>

    {loading && <p className="loading">Loading...</p>}
    {error && <p className="error-text">{error}</p>}

    {permNames.includes("createTask") && (
      <>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <button onClick={handleCreate}>Add Task</button>
      </>
    )}

    {tasks.map(task => (
      <div key={task._id} style={{ marginTop: "10px" }}>
        {task.title}

        {permNames.includes("deleteTask") && (
          <button onClick={() => handleDelete(task._id)}>
            Delete
          </button>
        )}
      </div>
    ))}
  </div>
);
};

export default TaskManager;