import express from "express";
import { getUserPermissionsController } from "../controllers/permission_serviceController.js";
import { authenticateJwt } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateJwt, getUserPermissionsController);
router.get("/user", authenticateJwt, getUserPermissionsController);

export default router;