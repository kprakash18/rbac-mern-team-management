import { Router } from "express";
import * as c from "./task.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const taskRouter = Router({ mergeParams: true });
taskRouter.post("/", authenticate, requirePermission("task.create"), c.createTaskController);
taskRouter.get("/", authenticate, requirePermission("task.read"), c.getTasksByTeamController);
taskRouter.get("/:taskId", authenticate, requirePermission("task.read"), c.getTaskByIdController);
taskRouter.patch("/:taskId", authenticate, c.updateTaskController);
taskRouter.delete("/:taskId", authenticate, requirePermission("task.delete"), c.deleteTaskController);

export default taskRouter;
