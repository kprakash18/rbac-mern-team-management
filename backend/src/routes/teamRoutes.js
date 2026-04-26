import express from 'express' ;
import { createTeam, getTeams } from "../controllers/teamController.js";
import { get } from 'mongoose';
const router = express.Router() ;

// api
router.post('/', createTeam) ;
router.get('/', getTeams) ;

export default router ;