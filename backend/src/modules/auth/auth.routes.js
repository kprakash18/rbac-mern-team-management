import { Router } from "express";
import {
  loginController,
  meController,
  changePasswordController,
  logoutController,
} from "./auth.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";

const authRouter = Router();

// Public routes
authRouter.post("/login", loginController);

// Authenticated routes
authRouter.get("/me", authenticate, meController);
authRouter.post("/change-password", authenticate, changePasswordController);
authRouter.post("/logout", authenticate, logoutController);

export default authRouter;
