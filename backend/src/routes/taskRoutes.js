import express from "express";
import {
  createTask,
  getTasks,
  deleteTask
} from "../controllers/taskController.js";

import { authenticateJwt } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

// GET TASKS
router.get("/", authenticateJwt, getTasks);

// CREATE TASK
router.post(
  "/",
  authenticateJwt,
  requirePermission("CREATE_TASK"),
  createTask
);

// DELETE TASK
router.delete(
  "/:id",
  authenticateJwt,
  requirePermission("DELETE_TASK"),
  deleteTask
);

export default router;
