import { verifyAccessToken } from "../common/security/jwt.js";
import User from "../modules/users/user.model.js";


export async function socketAuthMiddleware(socket, next){

    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token || typeof token !== "string") {
       return next(new Error("Authentication required. Missing token."));
    }

    // Strip 'Bearer ' prefix if present
    if (token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
    }
    try{
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.sub).select("_id email accountStatus name");
        if(!user){
            return next(new Error("Authentication Error: user account no longer exists"));
        }

        if (user.accountStatus === "SUSPENDED" || user.accountStatus === "DISABLED") {
            return next(new Error("Authorization error: Account is inactive or suspended."));
        }


        socket.data.user = {
            id: user._id.toString(),
            email: user.email,
            accountStatus: user.accountStatus,
            name: user.name,
        };
     next();
    }catch(error){
        return next(new Error("Authentication error: Invalid or expired token"));
    }
    

}