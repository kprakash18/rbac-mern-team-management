import express from 'express' ;
import { createTeam, deleteTeam, getTeams, updateTeam } from "../controllers/teamController.js";
import { authenticateJwt } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
const router = express.Router() ;

// api
router.get('/', authenticateJwt, getTeams) ;
router.post('/', authenticateJwt, requirePermission("createTeam"), createTeam) ;
router.put('/:teamId', authenticateJwt, requirePermission("editTeam"), updateTeam) ;
router.delete('/:teamId', authenticateJwt, requirePermission("deleteTeam"), deleteTeam) ;

export default router ;