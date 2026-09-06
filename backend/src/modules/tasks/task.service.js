import Task from "./task.model.js";
import Membership from "../memberships/membership.model.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../common/errors/error.js";
import { emitToTeam } from "../../realtime/event-emitter.js";
import { createNotification, createTargetedNotifications } from "../notifications/notification.service.js";
import { can } from "../authorization/authorization.service.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export async function createTask({ teamId, creatorUserId, title, description, assignedTo, priority, dueDate, remarks }) {
  const isMember = await Membership.findOne({ teamId, userId: creatorUserId, status: "ACTIVE" });
  if (!isMember) throw new ForbiddenError("You must be an active team member to create tasks.");

  if (assignedTo) {
    const activeMembership = await Membership.findOne({ teamId, userId: assignedTo, status: "ACTIVE" });
    if (!activeMembership) throw new ValidationError("Assignee must be an active member of this team");
  }

  const normPri = typeof priority === "string" ? priority.toUpperCase() : "MEDIUM";
  const finalPriority = VALID_PRIORITIES.includes(normPri) ? normPri : "MEDIUM";
  const parsedDate = dueDate ? new Date(dueDate) : null;
  const finalDueDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

  const task = await Task.create({
    title,
    description: description || remarks || "",
    teamId,
    createdBy: creatorUserId,
    assignedTo: assignedTo || null,
    priority: finalPriority,
    dueDate: finalDueDate,
    remarks: remarks || "",
  });

  emitToTeam(teamId, "task:created", { task });
  if (task.assignedTo) {
    createTargetedNotifications({
      actorId: creatorUserId,
      recipients: [task.assignedTo],
      type: "TASK_ASSIGNED",
      teamId,
      resourceType: "TASK",
      resourceId: task._id,
      metadata: { taskId: task._id, taskTitle: task.title },
    }).catch(() => {});
  }

  logAuditEvent({
    actorId: creatorUserId,
    action: "task.created",
    targetType: "Task",
    targetId: task._id,
    teamId,
    metadata: { title: task.title, priority: task.priority },
  });

  return task;
}

export async function getTasksByTeam({ teamId, query = {} }) {
  const { status, priority, assignedTo, page = 1, limit = 20 } = query;
  const filter = { teamId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const { page: pageNumber, limit: pageSize, skip } = getPaginationParams({ page, limit, defaultLimit: 20 });
  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("assignedTo createdBy", "name email"),
    Task.countDocuments(filter),
  ]);

  return { tasks, total, page: pageNumber, limit: pageSize, totalPages: getTotalPages(total, pageSize) };
}

export async function getTaskById({ teamId, taskId }) {
  const task = await Task.findOne({ _id: taskId, teamId }).populate("assignedTo createdBy", "name email");
  if (!task) throw new NotFoundError("Task not found in this team");
  return task;
}

export async function updateTask({ teamId, taskId, updates = {}, callerUserId }) {
  const existingTask = await Task.findOne({ _id: taskId, teamId });
  if (!existingTask) throw new NotFoundError("Task not found in this team");

  const prevAssignee = existingTask.assignedTo ? String(existingTask.assignedTo) : null;
  const prevStatus = existingTask.status;
  const prevRemarks = existingTask.remarks || "";
  const prevDueDate = existingTask.dueDate ? new Date(existingTask.dueDate).getTime() : null;

  if (callerUserId) {
    const isMember = await Membership.findOne({ teamId, userId: callerUserId, status: "ACTIVE" });
    if (!isMember) throw new ForbiddenError("You must be an active team member to update tasks.");

    const hasGlobalUpdate = await can(callerUserId, teamId, "task.update", taskId);
    const isAssignee = existingTask.assignedTo && String(existingTask.assignedTo) === String(callerUserId);

    if (!hasGlobalUpdate && !isAssignee) throw new ForbiddenError("You do not have permission to update this task.");
    if (!hasGlobalUpdate && isAssignee) {
      const unauthorized = Object.keys(updates).filter((f) => !["status", "remarks"].includes(f));
      if (unauthorized.length > 0) {
        throw new ForbiddenError(`Task assignees are only authorized to update status and remarks. Cannot modify: ${unauthorized.join(", ")}`);
      }
    }
  }

  if (updates.assignedTo) {
    const activeMembership = await Membership.findOne({ teamId, userId: updates.assignedTo, status: "ACTIVE" });
    if (!activeMembership) throw new ValidationError("Assignee must be an active member of this team");
  }

  const { title, description, assignedTo, status, priority, dueDate, remarks } = updates;
  const allowedUpdates = {};
  if (title !== undefined) allowedUpdates.title = title;
  if (description !== undefined) allowedUpdates.description = description;
  if (assignedTo !== undefined) allowedUpdates.assignedTo = assignedTo || null;
  if (status !== undefined) allowedUpdates.status = status;
  if (priority !== undefined) {
    const normPri = typeof priority === "string" ? priority.toUpperCase() : "MEDIUM";
    allowedUpdates.priority = VALID_PRIORITIES.includes(normPri) ? normPri : "MEDIUM";
  }
  let newParsedDueDate = undefined;
  if (dueDate !== undefined) {
    if (dueDate) {
      const parsed = new Date(dueDate);
      newParsedDueDate = !isNaN(parsed.getTime()) ? parsed : null;
      allowedUpdates.dueDate = newParsedDueDate;
    } else {
      newParsedDueDate = null;
      allowedUpdates.dueDate = null;
    }
  }
  if (remarks !== undefined) allowedUpdates.remarks = remarks;

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, teamId },
    { $set: allowedUpdates },
    { returnDocument: "after", runValidators: true }
  ).populate("assignedTo createdBy", "name email");

  if (!updatedTask) throw new NotFoundError("Task not found in this team");

  emitToTeam(teamId, "task:updated", { task: updatedTask });
  const newAssignee = updatedTask.assignedTo ? String(updatedTask.assignedTo._id || updatedTask.assignedTo) : null;

  if (allowedUpdates.assignedTo !== undefined && newAssignee !== prevAssignee && newAssignee) {
    createTargetedNotifications({
      actorId: callerUserId,
      recipients: [newAssignee],
      type: "TASK_ASSIGNED",
      teamId,
      resourceType: "TASK",
      resourceId: updatedTask._id,
      metadata: { taskId: updatedTask._id, taskTitle: updatedTask.title },
    }).catch(() => {});
  }

  if (status && status !== prevStatus) {
    const statusRecipients = [callerUserId, ...(newAssignee ? [newAssignee] : [])];
    createTargetedNotifications({
      actorId: callerUserId,
      recipients: statusRecipients,
      type: "TASK_STATUS_CHANGED",
      teamId,
      resourceType: "TASK",
      resourceId: updatedTask._id,
      metadata: { taskId: updatedTask._id, taskTitle: updatedTask.title, status, oldStatus: prevStatus },
    }).catch(() => {});
  }

  if (newParsedDueDate !== undefined) {
    const newTime = newParsedDueDate ? newParsedDueDate.getTime() : null;
    if (newTime !== prevDueDate && newAssignee) {
      createNotification({
        recipientId: newAssignee,
        actorId: callerUserId,
        type: "TASK_DUE_DATE_CHANGED",
        teamId,
        resourceType: "TASK",
        resourceId: updatedTask._id,
        metadata: { taskId: updatedTask._id, taskTitle: updatedTask.title, dueDate: newParsedDueDate ? newParsedDueDate.toLocaleDateString() : "None" },
      }).catch(() => {});
    }
  }

  if (remarks !== undefined && remarks !== prevRemarks) {
    const preview = remarks.trim().length > 60 ? `${remarks.trim().slice(0, 60)}\u2026` : remarks.trim();
    const creatorId = updatedTask.createdBy ? String(updatedTask.createdBy._id || updatedTask.createdBy) : null;
    const isCallerAssignee = newAssignee && newAssignee === String(callerUserId);
    const otherParty = isCallerAssignee ? creatorId : newAssignee;
    const remarksRecipients = [...new Set([String(callerUserId), ...(otherParty ? [otherParty] : [])])];

    createTargetedNotifications({
      actorId: callerUserId,
      recipients: remarksRecipients,
      type: "TASK_REMARKS_UPDATED",
      teamId,
      resourceType: "TASK",
      resourceId: updatedTask._id,
      metadata: { taskId: updatedTask._id, taskTitle: updatedTask.title, preview },
    }).catch(() => {});
  }

  logAuditEvent({
    actorId: callerUserId,
    action: status ? `task.status_${status.toLowerCase()}` : "task.updated",
    targetType: "Task",
    targetId: updatedTask._id,
    teamId,
    metadata: { title: updatedTask.title, status: updatedTask.status },
  });

  return updatedTask;
}

export async function deleteTask({ teamId, taskId, callerUserId }) {
  const deletedTask = await Task.findOneAndDelete({ _id: taskId, teamId });
  if (!deletedTask) throw new NotFoundError("Task not found in this team");

  emitToTeam(teamId, "task:deleted", { taskId, teamId });
  logAuditEvent({
    actorId: callerUserId || null,
    action: "task.deleted",
    targetType: "Task",
    targetId: deletedTask._id,
    teamId,
    metadata: { title: deletedTask.title },
  });

  return { success: true, message: "Task deleted successfully" };
}
