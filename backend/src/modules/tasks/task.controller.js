import { asyncHandler } from "../../common/utils/async-handler.js";
import * as taskService from "./task.service.js";

export const createTaskController = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, priority, dueDate, remarks } = req.body;
  const task = await taskService.createTask({
    teamId: req.params.teamId,
    creatorUserId: req.user.id,
    title,
    description,
    assignedTo,
    priority,
    dueDate,
    remarks,
  });
  res.status(201).json({ success: true, data: task });
});

export const getTasksByTeamController = asyncHandler(async (req, res) => {
  const result = await taskService.getTasksByTeam({
    teamId: req.params.teamId,
    query: req.query,
  });
  res.status(200).json({
    success: true,
    data: result.tasks,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

export const getTaskByIdController = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
  });
  res.status(200).json({ success: true, data: task });
});

export const updateTaskController = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
    updates: req.body,
    callerUserId: req.user.id,
  });
  res.status(200).json({ success: true, data: task });
});

export const deleteTaskController = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
  });
  res.status(200).json({ success: true, message: result.message });
});
