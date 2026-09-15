import { Router } from "express";
import * as c from "./authentication.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { authRateLimiter } from "../../common/middleware/rate-limiter.js";

const authRouter = Router();
authRouter.post("/login", authRateLimiter, c.loginController);
authRouter.get("/me", authenticate, c.meController);
authRouter.post("/change-password", authenticate, c.changePasswordController);
authRouter.post("/logout", authenticate, c.logoutController);

export default authRouter;
