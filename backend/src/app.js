import express from "express";
import cors from "cors";
import {swaggerDocs} from "./docs/swagger.js";
import authRouter from "./modules/authentication/authentication.routes.js";
import authorizationRouter from "./modules/authorization/authorization.routes.js";

import { errorHandler } from "./common/middleware/error-handler.js";
import permissionRouter from "./modules/permissions/permission.routes.js";
import roleRouter from "./modules/roles/role.routes.js";
import membershipRoleRouter from "./modules/member-roles/member-role.routes.js";
import teamRouter from "./modules/teams/team.routes.js";

import membershipRouter from "./modules/memberships/membership.routes.js";
import userRouter from "./modules/users/user.routes.js";
import {
  teamInvitationRouter,
  publicInvitationRouter,
} from "./modules/invitations/invitation.routes.js";
import taskRouter from "./modules/tasks/task.routes.js";
import accessRouter, { globalAccessRouter } from "./modules/access/access.routes.js";
import auditRouter, { globalAuditRouter } from "./modules/audit/audit.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";
import chatChannelRouter from "./modules/chat/chat-channel.routes.js";

import { env } from "./config/env.js";

const app = express();

const cleanUrl = (url) => (typeof url === "string" ? url.trim().replace(/\/+$/, "") : "");

const allowedOrigins = [
  cleanUrl(env.clientUrl),
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = cleanUrl(origin);
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith(".vercel.app") ||
        env.nodeEnv === "development";

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-team-id"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api-docs", swaggerDocs.serve, swaggerDocs.setup);
app.use("/api/auth", authRouter);
app.use("/api/authorization", authorizationRouter);
app.use("/api/permissions", permissionRouter) ;
app.use("/api/roles", roleRouter);
app.use("/api/teams/:teamId/members/:userId/roles", membershipRoleRouter);
app.use("/api/teams", teamRouter);
app.use("/api/teams/:teamId/members", membershipRouter);
app.use("/api/users", userRouter);
app.use("/api/teams/:teamId/invitations", teamInvitationRouter);
app.use("/api/invitations", publicInvitationRouter);
app.use("/api/teams/:teamId/tasks", taskRouter);
app.use("/api/teams/:teamId/access-requests", accessRouter);
app.use("/api/access-requests", globalAccessRouter);
app.use("/api/teams/:teamId/audit-logs", auditRouter);
app.use("/api/audit-logs", globalAuditRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/teams/:teamId/channels", chatChannelRouter);

app.use(errorHandler);

export default app;
