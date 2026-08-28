import * as taskService from "./task.service.js";

export async function createTaskController(req, res, next) {
  try {
    const { teamId } = req.params;
    const creatorUserId = req.user.id;
    const { title, description, assignedTo, priority, dueDate } = req.body;

    const task = await taskService.createTask({
      teamId,
      creatorUserId,
      title,
      description,
      assignedTo,
      priority,
      dueDate
    });

    return res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
}

export async function getTasksByTeamController(req, res, next) {
  try {
    const { teamId } = req.params;

    const result = await taskService.getTasksByTeam({
      teamId,
      query: req.query
    });

    return res.status(200).json({
      success: true,
      data: result.tasks,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getTaskByIdController(req, res, next) {
  try {
    const { teamId, taskId } = req.params;

    const task = await taskService.getTaskById({ teamId, taskId });

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskController(req, res, next) {
  try {
    const { teamId, taskId } = req.params;

    const task = await taskService.updateTask({
      teamId,
      taskId,
      updates: req.body
    });

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskController(req, res, next) {
  try {
    const { teamId, taskId } = req.params;

    const result = await taskService.deleteTask({ teamId, taskId });

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
}