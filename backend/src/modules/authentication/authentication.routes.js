import { Router } from "express";
import * as c from "./authentication.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { authRateLimiter } from "../../common/middleware/rate-limiter.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { changePasswordSchema, loginSchema } from "./authentication.schemas.js";

const authRouter = Router();
authRouter.post("/login", authRateLimiter, validateRequest(loginSchema), c.loginController);
authRouter.get("/me", authenticate, c.meController);
authRouter.post("/change-password", authenticate, validateRequest(changePasswordSchema), c.changePasswordController);
authRouter.post("/logout", authenticate, c.logoutController);

export default authRouter;
