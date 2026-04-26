import express from "express";
import cors from "cors";
import teamRoutes from "./routes/teamRoutes.js";
import permissionRoutes from './routes/permissionRoutes.js' ;
import roleRoutes from './routes/roleRoute.js' ;

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use('/api/teams', teamRoutes) ;
app.use('/api/permissions', permissionRoutes) ;
app.use('/api/roles', roleRoutes) ;

export default app;