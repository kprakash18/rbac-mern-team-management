import express from "express";
import { createUser, getUsers } from "../controllers/userController.js";
import { authenticateJwt } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateJwt, createUser);
router.get("/", authenticateJwt, getUsers);

export default router;
