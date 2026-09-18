import { Router } from "express";
import * as c from "./task.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireActiveTeamMember, requirePermission } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import {
  createTaskSchema,
  taskIdParamSchema,
  teamTaskListSchema,
  updateTaskSchema,
} from "./task.validation.js";

const taskRouter = Router({ mergeParams: true });
taskRouter.post("/", authenticate, validateRequest(createTaskSchema), requirePermission("task.create"), c.createTaskController);
taskRouter.get("/", authenticate, validateRequest(teamTaskListSchema), requirePermission("task.read"), c.getTasksByTeamController);
taskRouter.get("/:taskId", authenticate, validateRequest(taskIdParamSchema), requirePermission("task.read"), c.getTaskByIdController);
taskRouter.patch("/:taskId", authenticate, validateRequest(updateTaskSchema), requireActiveTeamMember(), c.updateTaskController);
taskRouter.delete("/:taskId", authenticate, validateRequest(taskIdParamSchema), requirePermission("task.delete"), c.deleteTaskController);

export default taskRouter;
