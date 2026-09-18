import {
  atLeastOneBodyField,
  optionalDate,
  optionalEnum,
  optionalObjectId,
  optionalString,
  requiredObjectId,
  requiredString,
} from "../../common/middleware/validate-request.js";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

export const createTaskSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  body: {
    title: requiredString({ max: 200 }),
    description: optionalString({ max: 2000 }),
    assignedTo: optionalObjectId(),
    priority: optionalEnum(PRIORITIES),
    dueDate: optionalDate(),
    remarks: optionalString({ max: 1000 }),
  },
};

export const updateTaskSchema = {
  params: {
    teamId: requiredObjectId(),
    taskId: requiredObjectId(),
  },
  body: {
    title: optionalString({ max: 200 }),
    description: optionalString({ max: 2000 }),
    assignedTo: optionalObjectId(),
    status: optionalEnum(STATUSES),
    priority: optionalEnum(PRIORITIES),
    dueDate: optionalDate(),
    remarks: optionalString({ max: 1000 }),
  },
  custom: [
    atLeastOneBodyField(["title", "description", "assignedTo", "status", "priority", "dueDate", "remarks"]),
  ],
};

export const taskIdParamSchema = {
  params: {
    teamId: requiredObjectId(),
    taskId: requiredObjectId(),
  },
};

export const teamTaskListSchema = {
  params: {
    teamId: requiredObjectId(),
  },
  query: {
    assignedTo: optionalObjectId(),
    status: optionalEnum(STATUSES),
    priority: optionalEnum(PRIORITIES),
  },
};
