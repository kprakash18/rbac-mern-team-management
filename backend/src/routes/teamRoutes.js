import express from 'express' ;
import { createTeam, getTeams } from "../controllers/teamController.js";
import { authenticateJwt } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
const router = express.Router() ;

// api
router.post('/', authenticateJwt, requirePermission("createTeam"), createTeam) ;
router.get('/', authenticateJwt, requirePermission("viewTeam"), getTeams) ;

export default router ;