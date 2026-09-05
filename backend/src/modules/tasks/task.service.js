import Task from "./task.model.js";
import Membership from "../memberships/membership.model.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../common/errors/error.js";
import { emitToTeam, emitToUser } from "../../realtime/event-emitter.js";
import { createNotification, createTargetedNotifications } from "../notifications/notification.service.js";
import { can } from "../authorization/authorization.service.js";
import { logAuditEvent } from "../audit/audit.service.js";

export async function createTask({ teamId, creatorUserId, title, description, assignedTo, priority, dueDate, remarks }) {
  const isMember = await Membership.findOne({ teamId, userId: creatorUserId, status: "ACTIVE" });
  if (!isMember) {
    throw new ForbiddenError("You must be an active team member to create tasks.");
  }

  if (assignedTo) {
    const activeMembership = await Membership.findOne({ teamId, userId: assignedTo, status: "ACTIVE" });
    if (!activeMembership) {
      throw new ValidationError("Assignee must be an active member of this team");
    }
  }

  const normalizedPriority = typeof priority === "string" ? priority.toUpperCase() : "MEDIUM";
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const finalPriority = validPriorities.includes(normalizedPriority) ? normalizedPriority : "MEDIUM";

  let finalDueDate = null;
  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (!isNaN(parsedDate.getTime())) {
      finalDueDate = parsedDate;
    }
  }

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

  // Real-time Event Emissions & Persistent Notification
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
    }).catch((err) => console.error("Failed to persist notification:", err));
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

import { getPaginationParams, getTotalPages } from "../../common/utils/index.js";

export async function getTasksByTeam({ teamId, query = {} }) {
  const { status, priority, assignedTo, page = 1, limit = 20 } = query;

  const filter = { teamId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const { page: pageNumber, limit: pageSize, skip } = getPaginationParams({ page, limit, defaultLimit: 20 });

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
    totalPages: getTotalPages(total, pageSize)
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

export async function updateTask({ teamId, taskId, updates = {}, callerUserId }) {
  // 1. Find existing task first
  const existingTask = await Task.findOne({ _id: taskId, teamId });
  if (!existingTask) {
    throw new NotFoundError("Task not found in this team");
  }

  const prevAssignee = existingTask.assignedTo ? String(existingTask.assignedTo) : null;
  const prevStatus = existingTask.status;
  const prevRemarks = existingTask.remarks || "";
  const prevDueDate = existingTask.dueDate ? new Date(existingTask.dueDate).getTime() : null;

  // 2. Ownership & Permission check
  if (callerUserId) {
    const isMember = await Membership.findOne({ teamId, userId: callerUserId, status: "ACTIVE" });
    if (!isMember) {
      throw new ForbiddenError("You must be an active team member to update tasks.");
    }

    const hasGlobalUpdate = await can(callerUserId, teamId, "task.update", taskId);
    const isAssignee = existingTask.assignedTo && existingTask.assignedTo.toString() === callerUserId.toString();

    if (!hasGlobalUpdate && !isAssignee) {
      throw new ForbiddenError("You do not have permission to update this task.");
    }

    // Assignees without global task.update can only update status and remarks
    if (!hasGlobalUpdate && isAssignee) {
      const allowedAssigneeFields = ["status", "remarks"];
      const requestedFields = Object.keys(updates);
      const unauthorizedFields = requestedFields.filter((f) => !allowedAssigneeFields.includes(f));
      if (unauthorizedFields.length > 0) {
        throw new ForbiddenError(
          `Task assignees are only authorized to update status and remarks. Cannot modify: ${unauthorizedFields.join(", ")}`
        );
      }
    }
  }

  // 3. Validate Assignee if provided and non-null
  if (updates.assignedTo) {
    const activeMembership = await Membership.findOne({
      teamId,
      userId: updates.assignedTo,
      status: "ACTIVE",
    });

    if (!activeMembership) {
      throw new ValidationError("Assignee must be an active member of this team");
    }
  }

  // 4. Destructure only allowed mutable fields (prevents modifying teamId, createdBy, _id)
  const { title, description, assignedTo, status, priority, dueDate, remarks } = updates;
  const allowedUpdates = {};
  if (title !== undefined) allowedUpdates.title = title;
  if (description !== undefined) allowedUpdates.description = description;
  if (assignedTo !== undefined) allowedUpdates.assignedTo = assignedTo || null;
  if (status !== undefined) allowedUpdates.status = status;
  if (priority !== undefined) {
    const normPri = typeof priority === "string" ? priority.toUpperCase() : "MEDIUM";
    allowedUpdates.priority = ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(normPri) ? normPri : "MEDIUM";
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

  // 5. Find and update task while enforcing tenant boundary and running schema validators
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

  // Real-time Event Emissions & Persistent Notification
  emitToTeam(teamId, "task:updated", { task: updatedTask });

  const newAssignee = updatedTask.assignedTo ? String(updatedTask.assignedTo._id || updatedTask.assignedTo) : null;

  // Notification 1: Task reassignment / assignment
  if (allowedUpdates.assignedTo !== undefined && newAssignee !== prevAssignee) {
    if (newAssignee) {
      createTargetedNotifications({
        actorId: callerUserId,
        recipients: [newAssignee],
        type: "TASK_ASSIGNED",
        teamId,
        resourceType: "TASK",
        resourceId: updatedTask._id,
        metadata: { taskId: updatedTask._id, taskTitle: updatedTask.title },
      }).catch((err) => console.error("Failed to persist notification:", err));
    }
  }

  // Notification 2: Task status updated (Notify Actor + Assignee only, deduplicated)
  if (status && status !== prevStatus) {
    const statusRecipients = [callerUserId];
    if (newAssignee) {
      statusRecipients.push(newAssignee);
    }
    createTargetedNotifications({
      actorId: callerUserId,
      recipients: statusRecipients,
      type: "TASK_STATUS_CHANGED",
      teamId,
      resourceType: "TASK",
      resourceId: updatedTask._id,
      metadata: { taskId: updatedTask._id, taskTitle: updatedTask.title, status, oldStatus: prevStatus },
    }).catch((err) => console.error("Failed to persist notification:", err));
  }

  // Notification 3: Due date update
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
        metadata: {
          taskId: updatedTask._id,
          taskTitle: updatedTask.title,
          dueDate: newParsedDueDate ? newParsedDueDate.toLocaleDateString() : "None",
        },
      }).catch((err) => console.error("Failed to persist notification:", err));
    }
  }

  // Notification 4: Remarks / Progress Note updated — notify both parties
  if (remarks !== undefined && remarks !== prevRemarks) {
    // Short preview (max 60 chars)
    const preview = remarks.trim().length > 60
      ? `${remarks.trim().slice(0, 60)}\u2026`
      : remarks.trim();

    // Other party logic:
    // - Assignee updated  → notify the task creator (admin/lead)
    // - Admin updated     → notify the assignee
    const creatorId = updatedTask.createdBy
      ? String(updatedTask.createdBy._id || updatedTask.createdBy)
      : null;

    const isCallerAssignee = newAssignee && newAssignee === String(callerUserId);
    const otherParty = isCallerAssignee ? creatorId : newAssignee;

    // Deduplicated recipient list: caller + other party
    const remarksRecipients = [String(callerUserId)];
    if (otherParty && otherParty !== String(callerUserId)) {
      remarksRecipients.push(otherParty);
    }

    createTargetedNotifications({
      actorId: callerUserId,
      recipients: remarksRecipients,
      type: "TASK_REMARKS_UPDATED",
      teamId,
      resourceType: "TASK",
      resourceId: updatedTask._id,
      metadata: { taskId: updatedTask._id, taskTitle: updatedTask.title, preview },
    }).catch((err) => console.error("Failed to persist remarks notification:", err));
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
  // 1. Find and remove task scoped by taskId AND teamId
  const deletedTask = await Task.findOneAndDelete({ _id: taskId, teamId });

  // 2. Throw error if task wasn't found or doesn't belong to the specified team
  if (!deletedTask) {
    throw new NotFoundError("Task not found in this team");
  }

  // Real-time Event Emission
  emitToTeam(teamId, "task:deleted", { taskId, teamId });

  logAuditEvent({
    actorId: callerUserId || null,
    action: "task.deleted",
    targetType: "Task",
    targetId: deletedTask._id,
    teamId,
    metadata: { title: deletedTask.title },
  });

  // 3. Return confirmation response
  return {
    success: true,
    message: "Task deleted successfully"
  };
}