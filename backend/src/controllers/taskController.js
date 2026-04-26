import Task from "../models/taskModels.js";

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const { title, description, teamId } = req.body;

    const task = await Task.create({
      title,
      description,
      team: teamId,
      createdBy: req.user.id
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET TASKS
export const getTasks = async (req, res) => {
  try {
    const { teamId } = req.query;

    const tasks = await Task.find({ team: teamId });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};