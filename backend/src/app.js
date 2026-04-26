import express from "express";
import cors from "cors";
import teamRoutes from "./routes/teamRoutes.js";
import permissionRoutes from './routes/permissionRoutes.js' ;
import roleRoutes from './routes/roleRoute.js' ;
import teamMemberRole from "./routes/teamMemberRoleRouter.js" ;
import permissionServiceRoutes from "./routes/permission_serviceRoute.js";
import authRoutes from "./routes/authRoutes.js";

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

export default app;