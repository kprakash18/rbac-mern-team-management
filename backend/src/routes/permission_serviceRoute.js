import express from "express";
import { getUserPermissionsController } from "../controllers/permission_serviceController.js";

const router = express.Router();

router.get("/user", getUserPermissionsController);

export default router;