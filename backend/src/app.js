import express from "express";
import cors from "cors";
import teamRoutes from "./routes/teamRoutes.js";
import permissionRoutes from './routes/permissionRoutes.js' ;
import roleRoutes from './routes/roleRoute.js' ;
import teamMemberRole from "./routes/teamMemberRoleRouter.js" ;
import permissionServiceRoutes from "./routes/permission_serviceRoute.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js" ;
import userRoutes from "./routes/userRoutes.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use('/api/teams', teamRoutes) ;
app.use('/api/permissions', permissionRoutes) ;
app.use('/api/roles', roleRoutes) ;
app.use('/api/teammemberrole', teamMemberRole) ;
app.use('/api/permission-service', permissionServiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

export default app;