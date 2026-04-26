import express from "express";
import { issueToken } from "../controllers/authController.js";

const router = express.Router();

router.post("/token", issueToken);

export default router;
