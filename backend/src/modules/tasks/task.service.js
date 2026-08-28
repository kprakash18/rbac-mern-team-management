import Task from "./task.model.js";
import Membership from "../memberships/membership.model.js";
import { NotFoundError, ValidationError } from "../../common/errors/error.js";

export async function createTask({ teamId, creatorUserId, title, description, assignedTo, priority, dueDate }) {
  if (assignedTo) {
    const activeMembership = await Membership.findOne({ teamId, userId: assignedTo, status: "ACTIVE" });
    if (!activeMembership) {
      throw new ValidationError("Assignee must be an active member of this team");
    }
  }

  const task = await Task.create({
    title,
    description,
    teamId,
    createdBy: creatorUserId,
    assignedTo: assignedTo || null,
    priority,
    dueDate
  });

  return task;
}

export async function getTasksByTeam({ teamId, query = {} }) {
  const { status, priority, assignedTo, page = 1, limit = 20 } = query;

  const filter = { teamId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email"),
    Task.countDocuments(filter)
  ]);

  return {
    tasks,
    total,
    page: pageNumber,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function getTaskById({ teamId, taskId }) {
  const task = await Task.findOne({ _id: taskId, teamId })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  if (!task) {
    throw new NotFoundError("Task not found in this team");
  }

  return task;
}

export async function updateTask({ teamId, taskId, updates = {} }) {
  // 1. Validate Assignee if provided and non-null
  if (updates.assignedTo) {
    const activeMembership = await Membership.findOne({
      teamId,
      userId: updates.assignedTo,
      status: "ACTIVE"
    });
    
    if (!activeMembership) {
      throw new ValidationError("Assignee must be an active member of this team");
    }
  }

  // 2. Destructure only allowed mutable fields (prevents modifying teamId, createdBy, _id)
  const { title, description, assignedTo, status, priority, dueDate } = updates;
  const allowedUpdates = {};
  if (title !== undefined) allowedUpdates.title = title;
  if (description !== undefined) allowedUpdates.description = description;
  if (assignedTo !== undefined) allowedUpdates.assignedTo = assignedTo;
  if (status !== undefined) allowedUpdates.status = status;
  if (priority !== undefined) allowedUpdates.priority = priority;
  if (dueDate !== undefined) allowedUpdates.dueDate = dueDate;

  // 3. Find and update task while enforcing tenant boundary and running schema validators
  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, teamId },
    { $set: allowedUpdates },
    { returnDocument: "after", runValidators: true }
  )
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  if (!updatedTask) {
    throw new NotFoundError("Task not found in this team");
  }

  return updatedTask;
}


export async function deleteTask({ teamId, taskId }) {
  // 1. Find and remove task scoped by taskId AND teamId
  const deletedTask = await Task.findOneAndDelete({ _id: taskId, teamId });

  // 2. Throw error if task wasn't found or doesn't belong to the specified team
  if (!deletedTask) {
    throw new NotFoundError("Task not found in this team");
  }

  // 3. Return confirmation response
  return {
    success: true,
    message: "Task deleted successfully"
  };
}