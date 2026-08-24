import express from "express";
import cors from "cors";
import authRouter from "./modules/auth/auth.routes.js";
import authorizationRouter from "./modules/authorization/authorization.routes.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import permissionRouter from "./modules/permissions/permission.routes.js";
import roleRouter from "./modules/roles/role.routes.js";

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/authorization", authorizationRouter);
app.use("/api/permissions", permissionRouter) ;
app.use("/api/roles", roleRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
