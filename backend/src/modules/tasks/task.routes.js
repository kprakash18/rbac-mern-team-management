import { Router } from "express";
import * as taskController from "./task.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const taskRouter = Router({ mergeParams: true });

taskRouter.post(
  "/",
  authenticate,
  requirePermission("task.create"),
  taskController.createTaskController
);

taskRouter.get(
  "/",
  authenticate,
  requirePermission("task.read"),
  taskController.getTasksByTeamController
);

taskRouter.get(
  "/:taskId",
  authenticate,
  requirePermission("task.read"),
  taskController.getTaskByIdController
);

taskRouter.patch(
  "/:taskId",
  authenticate,
  requirePermission("task.update"),
  taskController.updateTaskController
);

taskRouter.delete(
  "/:taskId",
  authenticate,
  requirePermission("task.delete"),
  taskController.deleteTaskController
);

export default taskRouter;