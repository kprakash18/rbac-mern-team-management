import express from "express";
import cors from "cors";
import {swaggerDocs} from "./docs/swagger.js";
import authRouter from "./modules/auth/auth.routes.js";
import authorizationRouter from "./modules/authorization/authorization.routes.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import permissionRouter from "./modules/permissions/permission.routes.js";
import roleRouter from "./modules/roles/role.routes.js";
import membershipRoleRouter from "./modules/memberships/membership-role.routes.js";
import teamRouter from "./modules/teams/team.routes.js";
import membershipRouter from "./modules/memberships/membership.routes.js";
import userRouter from "./modules/users/user.routes.js";
import invitationRouter from "./modules/invitations/invitation.router.js";

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
app.use("/api-docs", swaggerDocs.serve, swaggerDocs.setup);
app.use("/api/auth", authRouter);
app.use("/api/authorization", authorizationRouter);
app.use("/api/permissions", permissionRouter) ;
app.use("/api/roles", roleRouter);
app.use("/api/teams/:teamId/members/:userId/roles", membershipRoleRouter);
app.use("/api/teams", teamRouter);
app.use("/api/teams/:teamId/members", membershipRouter);
app.use("/api/users", userRouter);
app.use("/api/teams/:teamId/invitations", invitationRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
