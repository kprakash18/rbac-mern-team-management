import jwt from 'jsonwebtoken';
import {env} from '../../config/env.js';

export function signAccessToken(payload, options={}){
    const defaultOptions = {
        expiresIn : env.jwtExpiresIn || "1d" ,
    };

    return jwt.sign(payload, env.jwtSecret, {...defaultOptions, ...options});
    
}

export function verifyAccessToken(token){
    return jwt.verify(token, env.jwtSecret) ;
}