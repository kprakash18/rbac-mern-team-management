import express from 'express' ;
import {createPermission,getPermissions } from '../controllers/permissionController.js' ;
import { get } from 'mongoose';
const router = express.Router() ;

router.post('/', createPermission) ;
router.get('/', getPermissions) ;

export default router ;