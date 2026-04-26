import express from 'express' ;
import {createPermission,getPermissions } from '../controllers/permissionController.js' ;
import { authenticateJwt } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
const router = express.Router() ;

router.post('/', authenticateJwt, requirePermission("createPermission"), createPermission) ;
router.get('/', authenticateJwt, requirePermission("viewPermission"), getPermissions) ;

export default router ;