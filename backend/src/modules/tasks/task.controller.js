import { asyncHandler } from "../../common/utils/async-handler.js";
import { paginationMeta, sendCreated, sendSuccess } from "../../common/http/response.js";
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
  sendCreated(res, { data: task });
});

export const getTasksByTeamController = asyncHandler(async (req, res) => {
  const result = await taskService.getTasksByTeam({
    teamId: req.params.teamId,
    query: req.query,
  });
  sendSuccess(res, {
    data: result.tasks,
    meta: paginationMeta(result),
  });
});

export const getTaskByIdController = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
  });
  sendSuccess(res, { data: task });
});

export const updateTaskController = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
    updates: req.body,
    callerUserId: req.user.id,
  });
  sendSuccess(res, { data: task });
});

export const deleteTaskController = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask({
    teamId: req.params.teamId,
    taskId: req.params.taskId,
    callerUserId: req.user.id,
  });
  sendSuccess(res, { message: result.message });
});
